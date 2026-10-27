using System.ComponentModel.DataAnnotations;

namespace Marginalia.Api.Models;

public class Quote
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    [Required, MaxLength(600)]
    public string Text { get; set; } = string.Empty;

    [Required, MaxLength(200)]
    public string Author { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
