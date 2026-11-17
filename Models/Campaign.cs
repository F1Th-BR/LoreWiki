public class Campaign
{
    public Guid Id { get; set; }
    public Guid WorldId { get; set; }
    public Guid MasterId { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime? StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }
}