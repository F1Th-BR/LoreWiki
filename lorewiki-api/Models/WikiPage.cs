public class WikiPage
{
    public Guid Id { get; set; }
    public Guid WorldId { get; set; }
    public Guid? CampaignId { get; set; }  // ? = campanha é opcional
    public string PageType { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public int Version { get; set; }
    public bool IsDraft { get; set; }
    public Guid CreatedBy { get; set; }
    public Guid UpdatedBy { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }
}