using Dapper;
using System.Security.Claims;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;

public static class ImagesEndpoints
{
    // Formatos aceitos e tamanho máximo, direto do RF-12/RNF-07 do documento
    private static readonly string[] MimeTypesPermitidos =
        { "image/png", "image/jpeg", "image/webp" };

    private const int TamanhoMaximoBytes = 10 * 1024 * 1024; // 10 MB

    public static void MapRoutes(WebApplication app)
    {
        // POST /images — faz upload de uma imagem nova (biblioteca centralizada,
        // ainda sem vincular a nenhuma página específica)
        app.MapPost("/images", async (HttpRequest request, HttpContext ctx) =>
        {
            var userId = Guid.Parse(ctx.User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            // ── Lê o arquivo enviado via multipart/form-data ────────────────
            // Diferente dos outros endpoints (que recebem JSON), upload de
            // arquivo usa um formato diferente de corpo de requisição.
            // O Postman/front-end precisa mandar isso como "form-data",
            // não "raw JSON".
            if (!request.HasFormContentType)
                return Results.BadRequest("Envie o arquivo como form-data.");

            var form = await request.ReadFormAsync();
            var arquivo = form.Files.GetFile("file");

            if (arquivo is null || arquivo.Length == 0)
                return Results.BadRequest("Nenhum arquivo enviado.");

            // ── Validação de tamanho (RNF-07: máx. 10 MB) ───────────────────
            if (arquivo.Length > TamanhoMaximoBytes)
                return Results.BadRequest("Arquivo excede o limite de 10 MB.");

            // ── Validação de formato (RF-12: PNG, JPEG, WebP) ───────────────
            if (!MimeTypesPermitidos.Contains(arquivo.ContentType))
                return Results.BadRequest("Formato não suportado. Use PNG, JPEG ou WebP.");

            // ── Gera nomes de arquivo únicos (evita sobrescrever uploads) ──
            var extensao = Path.GetExtension(arquivo.FileName);
            var nomeArquivo = $"{Guid.NewGuid()}{extensao}";
            var nomeThumbnail = $"{Guid.NewGuid()}_thumb{extensao}";

            var pastaUploads = Path.Combine("wwwroot", "uploads");
            var caminhoCompleto = Path.Combine(pastaUploads, nomeArquivo);
            var caminhoThumbnail = Path.Combine(pastaUploads, nomeThumbnail);

            // ── Salva o arquivo original no disco ───────────────────────────
            await using (var stream = new FileStream(caminhoCompleto, FileMode.Create))
            {
                await arquivo.CopyToAsync(stream);
            }

            // ── Gera o thumbnail com ImageSharp (RF-13) ─────────────────────
            // Redimensiona mantendo proporção, com largura máxima de 300px
            using (var imagem = await SixLabors.ImageSharp.Image.LoadAsync(caminhoCompleto))
            {
                imagem.Mutate(x => x.Resize(new ResizeOptions
                {
                    Mode = ResizeMode.Max,
                    Size = new Size(300, 300)
                }));

                await imagem.SaveAsync(caminhoThumbnail);
            }

            // ── Salva os metadados no banco ─────────────────────────────────
            using var conn = DbConnection.Criar();

            var url = $"/uploads/{nomeArquivo}";
            var thumbnailUrl = $"/uploads/{nomeThumbnail}";

            var imageId = await conn.ExecuteScalarAsync<Guid>(
                @"INSERT INTO images (uploaded_by, url, thumbnail_url, mime_type, size_bytes)
                  VALUES (@UploadedBy, @Url, @ThumbnailUrl, @MimeType, @SizeBytes)
                  RETURNING id",
                new
                {
                    UploadedBy = userId,
                    Url = url,
                    ThumbnailUrl = thumbnailUrl,
                    MimeType = arquivo.ContentType,
                    SizeBytes = (int)arquivo.Length
                });

            return Results.Created($"/images/{imageId}", new { id = imageId, url, thumbnailUrl });

        }).RequireAuthorization();

        // POST /pages/{pageId}/images — vincula uma imagem já existente a uma página
        // (implementa o reuso: mesma imagem em múltiplas páginas)
        app.MapPost("/pages/{pageId}/images", async (
            Guid pageId, LinkImageRequest req, HttpContext ctx, RbacService rbac) =>
        {
            var userId = Guid.Parse(ctx.User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            // Só quem pode EDITAR a página pode vincular imagem a ela (RN-10)
            if (!await rbac.UserCanEdit(userId, pageId))
                return Results.Forbid();

            using var conn = DbConnection.Criar();

            await conn.ExecuteAsync(
                @"INSERT INTO page_images (page_id, image_id, role, sort_order)
                  VALUES (@PageId, @ImageId, @Role, @SortOrder)",
                new { PageId = pageId, req.ImageId, req.Role, req.SortOrder });

            return Results.Created("", new { mensagem = "Imagem vinculada à página!" });

        }).RequireAuthorization();

        // GET /pages/{pageId}/images — lista imagens vinculadas a uma página (galeria, RF-14)
        app.MapGet("/pages/{pageId}/images", async (Guid pageId) =>
        {
            using var conn = DbConnection.Criar();

            var imagens = await conn.QueryAsync(
                @"SELECT i.id, i.url, i.thumbnail_url, pi.role, pi.sort_order
                  FROM page_images pi
                  JOIN images i ON i.id = pi.image_id
                  WHERE pi.page_id = @PageId
                  ORDER BY pi.sort_order",
                new { PageId = pageId });

            return Results.Ok(imagens);
        });
    }
}

public record LinkImageRequest(Guid ImageId, string Role, int SortOrder);