using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Marginalia.Api.Data;
using Marginalia.Api.Dtos;
using Marginalia.Api.Extensions;
using Marginalia.Api.Models;

namespace Marginalia.Api.Controllers;

[ApiController]
[Route("api/books")]
[Authorize]
public class BooksController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var books = await db.Books
            .AsNoTracking()
            .Where(b => b.UserId == userId)
            .OrderBy(b => b.Title)
            .ThenBy(b => b.Id)
            .Select(b => new BookResponse(b.Id, b.Title, b.Author, b.PublishedDate, b.Description))
            .ToListAsync(cancellationToken);

        return Ok(books);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var book = await db.Books
            .AsNoTracking()
            .Where(b => b.Id == id && b.UserId == userId)
            .Select(b => new BookResponse(b.Id, b.Title, b.Author, b.PublishedDate, b.Description))
            .SingleOrDefaultAsync(cancellationToken);

        if (book is null)
        {
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Not Found",
                detail: "Boken hittades inte"
            );
        }

        return Ok(book);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] BookRequest request, CancellationToken cancellationToken)
    {
        if (!ValidateAndNormalize(request, out var title, out var author, out var publishedDate, out var description))
        {
            return ValidationProblem(ModelState);
        }

        var userId = User.GetUserId();
        var book = new Book
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = title,
            Author = author,
            PublishedDate = publishedDate,
            Description = description,
            CreatedAt = DateTime.UtcNow
        };

        db.Books.Add(book);
        await db.SaveChangesAsync(cancellationToken);

        var response = new BookResponse(book.Id, book.Title, book.Author, book.PublishedDate, book.Description);
        return CreatedAtAction(nameof(GetById), new { id = book.Id }, response);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update([FromRoute] Guid id, [FromBody] BookRequest request, CancellationToken cancellationToken)
    {
        if (!ValidateAndNormalize(request, out var title, out var author, out var publishedDate, out var description))
        {
            return ValidationProblem(ModelState);
        }

        var userId = User.GetUserId();
        var book = await db.Books
            .SingleOrDefaultAsync(b => b.Id == id && b.UserId == userId, cancellationToken);

        if (book is null)
        {
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Not Found",
                detail: "Boken hittades inte"
            );
        }

        book.Title = title;
        book.Author = author;
        book.PublishedDate = publishedDate;
        book.Description = description;

        await db.SaveChangesAsync(cancellationToken);

        var response = new BookResponse(book.Id, book.Title, book.Author, book.PublishedDate, book.Description);
        return Ok(response);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var book = await db.Books
            .SingleOrDefaultAsync(b => b.Id == id && b.UserId == userId, cancellationToken);

        if (book is null)
        {
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Not Found",
                detail: "Boken hittades inte"
            );
        }

        db.Books.Remove(book);
        await db.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    private bool ValidateAndNormalize(
        BookRequest? request,
        out string trimmedTitle,
        out string trimmedAuthor,
        out DateOnly publishedDate,
        out string? normalizedDescription)
    {
        trimmedTitle = string.Empty;
        trimmedAuthor = string.Empty;
        publishedDate = default;
        normalizedDescription = null;

        if (request is null)
        {
            AddUniqueModelError(nameof(BookRequest.Title), "Ange bokens titel");
            AddUniqueModelError(nameof(BookRequest.Author), "Ange bokens författare");
            AddUniqueModelError(nameof(BookRequest.PublishedDate), "Välj ett publiceringsdatum");
            return false;
        }

        trimmedTitle = request.Title?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            AddUniqueModelError(nameof(BookRequest.Title), "Ange bokens titel");
        }
        else if (trimmedTitle.Length > 200)
        {
            AddUniqueModelError(nameof(BookRequest.Title), "Titeln får vara högst 200 tecken");
        }

        trimmedAuthor = request.Author?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(request.Author))
        {
            AddUniqueModelError(nameof(BookRequest.Author), "Ange bokens författare");
        }
        else if (trimmedAuthor.Length > 200)
        {
            AddUniqueModelError(nameof(BookRequest.Author), "Författaren får vara högst 200 tecken");
        }

        if (!request.PublishedDate.HasValue || request.PublishedDate.Value == default(DateOnly))
        {
            AddUniqueModelError(nameof(BookRequest.PublishedDate), "Välj ett publiceringsdatum");
        }
        else
        {
            publishedDate = request.PublishedDate.Value;
        }

        if (string.IsNullOrWhiteSpace(request.Description))
        {
            normalizedDescription = null;
        }
        else
        {
            var trimmedDescription = request.Description.Trim();
            if (trimmedDescription.Length > 500)
            {
                AddUniqueModelError(nameof(BookRequest.Description), "Beskrivningen får vara högst 500 tecken");
            }
            else
            {
                normalizedDescription = trimmedDescription;
            }
        }

        return ModelState.IsValid;
    }

    private void AddUniqueModelError(string key, string errorMessage)
    {
        if (ModelState.TryGetValue(key, out var entry))
        {
            if (entry.Errors.Any(e => e.ErrorMessage == errorMessage))
            {
                return;
            }
        }

        ModelState.AddModelError(key, errorMessage);
    }
}
