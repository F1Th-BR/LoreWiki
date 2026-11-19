using Dapper;

public class RbacService
{
    public async Task<bool> UserCanEdit(Guid userId, Guid pageId)
    {
        using var conn = DbConnection.Criar();

        var page = await conn.QueryFirstOrDefaultAsync<WikiPage>(
            "SELECT * FROM wiki_pages WHERE id = @Id AND deleted_at IS NULL",
            new { Id = pageId });

        if (page is null) return false;

        // 1. Criador do mundo pode tudo
        var isCreator = await conn.ExecuteScalarAsync<bool>(
            @"SELECT EXISTS(SELECT 1 FROM roles
              WHERE user_id = @UserId AND role_type = 'creator'
              AND scope_type = 'world' AND scope_id = @WorldId)",
            new { UserId = userId, WorldId = page.WorldId });

        if (isCreator) return true;

        // 2. Mestre da campanha pode tudo na sua campanha
        if (page.CampaignId.HasValue)
        {
            var isMaster = await conn.ExecuteScalarAsync<bool>(
                @"SELECT EXISTS(SELECT 1 FROM roles
                  WHERE user_id = @UserId AND role_type = 'master'
                  AND scope_type = 'campaign' AND scope_id = @CampId)",
                new { UserId = userId, CampId = page.CampaignId });

            if (isMaster) return true;
        }

        // 3. Jogador só pode editar páginas vinculadas a ele
        return await conn.ExecuteScalarAsync<bool>(
            @"SELECT EXISTS(SELECT 1 FROM player_page_links
              WHERE player_id = @UserId AND page_id = @PageId)",
            new { UserId = userId, PageId = pageId });
    }
}