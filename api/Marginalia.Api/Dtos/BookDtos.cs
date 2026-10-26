using System.ComponentModel.DataAnnotations;

namespace Marginalia.Api.Dtos;

public record BookRequest
{
    [Required(ErrorMessage = "Ange bokens titel", AllowEmptyStrings = false)]
    [MaxLength(200, ErrorMessage = "Titeln får vara högst 200 tecken")]
    public string Title { get; init; } = string.Empty;

    [Required(ErrorMessage = "Ange bokens författare", AllowEmptyStrings = false)]
    [MaxLength(200, ErrorMessage = "Författaren får vara högst 200 tecken")]
    public string Author { get; init; } = string.Empty;

    [Required(ErrorMessage = "Välj ett publiceringsdatum")]
    public DateOnly? PublishedDate { get; init; }

    [MaxLength(500, ErrorMessage = "Beskrivningen får vara högst 500 tecken")]
    public string? Description { get; init; }

    public BookRequest() { }

    public BookRequest(string title, string author, DateOnly? publishedDate, string? description = null)
    {
        Title = title;
        Author = author;
        PublishedDate = publishedDate;
        Description = description;
    }

    public void Deconstruct(out string title, out string author, out DateOnly? publishedDate, out string? description)
    {
        title = Title;
        author = Author;
        publishedDate = PublishedDate;
        description = Description;
    }
}

public record BookResponse(
    Guid Id,
    string Title,
    string Author,
    DateOnly PublishedDate,
    string? Description
);
