public class Image
{
    public Guid Id { get; set; }
    public Guid UploadedBy { get; set; }
    public string Url { get; set; } = string.Empty;
    public string ThumbnailUrl { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public int SizeBytes { get; set; }
    public DateTime UploadedAt { get; set; }
}