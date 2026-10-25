using System.ComponentModel.DataAnnotations;

namespace Marginalia.Api.Models;

public class User
{
    public Guid Id { get; set; }

    [Required, MaxLength(30)]
    public string Username { get; set; } = string.Empty;

    [Required, MaxLength(30)]
    public string UsernameNormalized { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Book> Books { get; set; } = [];
    public ICollection<Quote> Quotes { get; set; } = [];
}
