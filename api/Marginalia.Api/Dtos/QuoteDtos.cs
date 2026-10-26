using System.ComponentModel.DataAnnotations;

namespace Marginalia.Api.Dtos;

public record QuoteRequest
{
    [Required(ErrorMessage = "Ange citatet", AllowEmptyStrings = false)]
    [MaxLength(600, ErrorMessage = "Citatet får vara högst 600 tecken")]
    public string Text { get; init; } = string.Empty;

    [Required(ErrorMessage = "Ange citatets författare", AllowEmptyStrings = false)]
    [MaxLength(200, ErrorMessage = "Författaren får vara högst 200 tecken")]
    public string Author { get; init; } = string.Empty;

    public QuoteRequest() { }

    public QuoteRequest(string text, string author)
    {
        Text = text;
        Author = author;
    }

    public void Deconstruct(out string text, out string author)
    {
        text = Text;
        author = Author;
    }
}

public record QuoteResponse(
    Guid Id,
    string Text,
    string Author
);
