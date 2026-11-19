using Dapper;
using System.Security.Claims;

public static class PagesEndpoints
{
    public static void MapRoutes(WebApplication app)
    {
        app.MapPost("/pages", async (CreatePageRequest req, HttpContext ctx, RbacService rbac) =>
        {
            // Pega o ID do usuário logado a partir do token JWT
            // (o mesmo padrão usado no POST /worlds)
            var userId = Guid.Parse(ctx.User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            using var conn = DbConnection.Criar();

            // ── Verificação de permissão ANTES de qualquer escrita ──────────
            // Diferente da edição (que usa RbacService.UserCanEdit em uma página
            // JÁ existente), criar página nova exige checar permissão no
            // MUNDO ou CAMPANHA de destino, já que a página ainda não existe.
            //
            // Regra: só Criador do Mundo ou Mestre da Campanha podem criar
            // páginas novas (RN-05/RN-06 do documento de requisitos).
            // Jogadores só EDITAM páginas já vinculadas a eles — não criam.
            var isCreator = await conn.ExecuteScalarAsync<bool>(
                @"SELECT EXISTS(SELECT 1 FROM roles
                WHERE user_id = @UserId AND role_type = 'creator'
                AND scope_type = 'world' AND scope_id = @WorldId)",
                new { UserId = userId, WorldId = req.WorldId });

            var isMaster = false;
            if (req.CampaignId.HasValue)
            {
                isMaster = await conn.ExecuteScalarAsync<bool>(
                    @"SELECT EXISTS(SELECT 1 FROM roles
                    WHERE user_id = @UserId AND role_type = 'master'
                    AND scope_type = 'campaign' AND scope_id = @CampaignId)",
                    new { UserId = userId, req.CampaignId });
            }

            if (!isCreator && !isMaster)
                return Results.Forbid();  // 403 — não tem permissão nesse mundo/campanha

            // ── Geração do slug (URL amigável) ──────────────────────────────
            // Ex: "Rei Arthur" → "rei-arthur". Isso é o RF-07/RF-10 do
            // documento — cada página precisa de uma URL legível e única
            // dentro do mundo (UNIQUE(world_id, slug) já garante isso no banco).
            var slug = req.Title
                .ToLowerInvariant()
                .Replace(" ", "-");
            // (Nota: isso é uma versão simplificada. Títulos com acentos ou
            // caracteres especiais vão precisar de um tratamento melhor depois —
            // por exemplo, remover acentuação antes de gerar o slug.)

            // ── Inserção da página ───────────────────────────────────────────
            // version começa em 1 (RF: usado depois para detectar conflitos de edição)
            // created_by e updated_by são o mesmo usuário na criação
            var pageId = await conn.ExecuteScalarAsync<Guid>(
                @"INSERT INTO wiki_pages
                    (world_id, campaign_id, page_type, title, slug, content,
                    is_draft, created_by, updated_by)
                VALUES
                    (@WorldId, @CampaignId, @PageType, @Title, @Slug, @Content,
                    @IsDraft, @UserId, @UserId)
                RETURNING id",
                new
                {
                    req.WorldId,
                    req.CampaignId,
                    req.PageType,
                    req.Title,
                    Slug = slug,
                    Content = req.Content ?? string.Empty,
                    req.IsDraft,
                    UserId = userId
                });

            return Results.Created($"/pages/{pageId}", new { id = pageId, mensagem = "Página criada!" });

        }).RequireAuthorization();  // exige login
           

        app.MapGet("/pages/{id}", async (Guid id) =>
        {
            using var conn = DbConnection.Criar();

            // Leitura é pública — não exige .RequireAuthorization().
            // Isso implementa o papel "Visitante" do documento de requisitos
            // (seção 3.3.1): qualquer um pode ler, sem estar logado.
            //
            // deleted_at IS NULL: respeita o soft delete — página "deletada"
            // não aparece mais, mas continua no banco (RN-12).
            var page = await conn.QueryFirstOrDefaultAsync<WikiPage>(
                "SELECT * FROM wiki_pages WHERE id = @Id AND deleted_at IS NULL",
                new { Id = id });

            // Se não encontrou (não existe ou foi deletada), retorna 404
            if (page is null)
                return Results.NotFound();

            return Results.Ok(page);
        });
    
        app.MapPut("/pages/{id}", async (
            Guid id, EditPageRequest req,
            HttpContext ctx, RbacService rbac) =>
        {
            var userId = Guid.Parse(ctx.User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            // ── 1. Verifica permissão ANTES de qualquer coisa ───────────────
            // Aqui SIM usamos o RbacService, porque a página já existe —
            // é exatamente o método que criamos no capítulo anterior.
            if (!await rbac.UserCanEdit(userId, id))
                return Results.Forbid();  // 403

            using var conn = DbConnection.Criar();
            await conn.OpenAsync();  // obrigatório antes de transação (lembra do bug do /worlds!)
            using var transacao = await conn.BeginTransactionAsync();

            try
            {
                // ── 2. Salva a revisão ANTES de atualizar ────────────────────
                // Pega o conteúdo ATUAL da página (antes da mudança) direto do banco,
                // e grava como content_before/content_after na tabela revisions.
                // Isso implementa RF-15/RF-16: toda edição gera uma revisão
                // com autor, timestamp e o conteúdo completo (para gerar diff depois).
                var linhasRevisao = await conn.ExecuteAsync(
                    @"INSERT INTO revisions (page_id, user_id, content_before, content_after, summary)
                    SELECT id, @UserId, content, @NovoConteudo, @Resumo
                    FROM wiki_pages WHERE id = @PageId",
                    new
                    {
                        UserId = userId,
                        PageId = id,
                        NovoConteudo = req.Content,
                        Resumo = req.Summary
                    },
                    transacao);

                // ── 3. Atualiza a página, COM controle de conflito ──────────
                // O WHERE inclui "AND version = @VersionEsperada": isso é
                // o RN-11 do documento (conflito de edição simultânea).
                // Se outra pessoa editou a página entre o momento em que o
                // usuário abriu o editor e o momento em que ele salvou, a
                // versão no banco já mudou — e essa query não vai encontrar
                // nenhuma linha pra atualizar (linhas afetadas = 0).
                var linhasAtualizadas = await conn.ExecuteAsync(
                    @"UPDATE wiki_pages
                    SET content = @Content, title = @Title, version = version + 1,
                        updated_by = @UserId, updated_at = NOW()
                    WHERE id = @PageId AND version = @VersionEsperada",
                    new
                    {
                        req.Content,
                        req.Title,
                        UserId = userId,
                        PageId = id,
                        VersionEsperada = req.Version
                    },
                    transacao);

                // ── 4. Se não atualizou nenhuma linha = conflito detectado ──
                if (linhasAtualizadas == 0)
                {
                    await transacao.RollbackAsync();  // desfaz até a revisão que tínhamos inserido
                    return Results.Conflict("Conflito: a página foi editada por outra pessoa. Recarregue e tente novamente.");
                }

                // ── 5. Tudo certo — confirma as duas operações juntas ───────
                await transacao.CommitAsync();
                return Results.Ok(new { mensagem = "Página salva!" });
            }
            catch
            {
                // Qualquer erro inesperado desfaz TUDO (revisão + update),
                // garantindo que o banco nunca fique num estado "pela metade".
                await transacao.RollbackAsync();
                throw;
            }

        }).RequireAuthorization();

    }
}


// Record que recebe os dados do front-end para criar uma página
public record CreatePageRequest(
    Guid WorldId,
    Guid? CampaignId,
    string PageType,
    string Title,
    string? Content,
    bool IsDraft);

// Inclui o Version atual que o front-end tinha quando abriu o editor —
// é isso que permite detectar se alguém mudou a página nesse meio-tempo
public record EditPageRequest(string Title, string Content, string? Summary, int Version);
