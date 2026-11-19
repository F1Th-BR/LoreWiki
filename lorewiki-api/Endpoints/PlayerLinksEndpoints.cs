using Dapper;
using System.Security.Claims;

public static class PlayerLinksEndpoints
{
    public static void MapRoutes(WebApplication app)
    {
        // POST /campaigns/{campaignId}/links
        // Vincula um Jogador a uma página específica (geralmente a página
        // do próprio personagem dele) dentro de uma campanha.
        // Implementa RF-06 e UC-03 do documento de requisitos.
        app.MapPost("/campaigns/{campaignId}/links", async (
            Guid campaignId, CreateLinkRequest req, HttpContext ctx) =>
        {
            // Pega o ID de quem está fazendo a chamada, a partir do token JWT
            var userId = Guid.Parse(ctx.User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            using var conn = DbConnection.Criar();

            // ── Busca a campanha primeiro ────────────────────────────────────
            // Precisamos saber a qual MUNDO essa campanha pertence, porque a
            // permissão de vincular jogador pode vir de duas fontes diferentes
            // (ver abaixo). Sem isso, não teríamos como checar se quem chama
            // é o Criador do mundo dono dessa campanha.
            var campaign = await conn.QueryFirstOrDefaultAsync<Campaign>(
                "SELECT * FROM campaigns WHERE id = @Id", new { Id = campaignId });

            // Se a campanha não existe, nem faz sentido continuar
            if (campaign is null)
                return Results.NotFound();

            // ── Verificação de permissão: Mestre da campanha OU Criador do mundo ──
            // Isso implementa a herança de permissões da seção 3.3.4 do
            // documento de requisitos: "Criador do Mundo herda todas as
            // permissões do Mestre de Campanha". Sem essa segunda checagem,
            // o Criador do Mundo ficaria bloqueado em campanhas onde ele não
            // é o Mestre "titular" (por exemplo, se atribuiu o papel a outra
            // pessoa via assign-master).
            var isMaster = await conn.ExecuteScalarAsync<bool>(
                @"SELECT EXISTS(SELECT 1 FROM roles
                  WHERE user_id = @UserId AND role_type = 'master'
                  AND scope_type = 'campaign' AND scope_id = @CampaignId)",
                new { UserId = userId, CampaignId = campaignId });

            var isCreator = await conn.ExecuteScalarAsync<bool>(
                @"SELECT EXISTS(SELECT 1 FROM roles
                  WHERE user_id = @UserId AND role_type = 'creator'
                  AND scope_type = 'world' AND scope_id = @WorldId)",
                new { UserId = userId, WorldId = campaign.WorldId });

            if (!isMaster && !isCreator)
                return Results.Forbid();  // 403 — nem Mestre nem Criador do mundo

            // ── Cria o vínculo ────────────────────────────────────────────────
            // A constraint UNIQUE(player_id, page_id) definida na migration 007
            // já impede duplicar o mesmo vínculo no banco — se alguém tentar
            // vincular o mesmo jogador à mesma página duas vezes, o Postgres
            // recusa com um erro de violação de unicidade (23505).
            try
            {
                await conn.ExecuteAsync(
                    @"INSERT INTO player_page_links (player_id, page_id, campaign_id)
                    VALUES (@PlayerId, @PageId, @CampaignId)",
                    new { req.PlayerId, req.PageId, CampaignId = campaignId });

                return Results.Created("", new { mensagem = "Jogador vinculado à página!" });
            }
            catch (Npgsql.PostgresException ex) when (ex.SqlState == "23505")
            {
                // 23505 = violação de constraint UNIQUE no Postgres.
                // Isso significa que esse jogador já está vinculado a essa página —
                // não é um erro do servidor, é uma situação esperada de negócio,
                // então respondemos com 409 Conflict em vez de deixar estourar um 500.
                return Results.Conflict("Esse jogador já está vinculado a essa página.");
            }

        }).RequireAuthorization();  // precisa estar logado pra chamar esse endpoint


        // GET /campaigns/{campaignId}/links
        // Lista todos os vínculos jogador-página de uma campanha.
        // Leitura pública (sem RequireAuthorization) — útil, por exemplo,
        // pro Mestre conferir rapidamente quem está vinculado a quê,
        // ou futuramente pro front-end montar uma lista de "personagens
        // jogáveis" na tela da campanha.
        app.MapGet("/campaigns/{campaignId}/links", async (Guid campaignId) =>
        {
            using var conn = DbConnection.Criar();

            var links = await conn.QueryAsync(
                "SELECT * FROM player_page_links WHERE campaign_id = @CampaignId",
                new { CampaignId = campaignId });

            return Results.Ok(links);
        });
    }
}

// Record que recebe os dados do front-end para criar um vínculo.
// PlayerId: o usuário que vai poder editar a página.
// PageId: a página (geralmente tipo "character") que ele passa a controlar.
public record CreateLinkRequest(Guid PlayerId, Guid PageId);