using System.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Marginalia.Api.Data;
using Marginalia.Api.Dtos;
using Marginalia.Api.Extensions;
using Marginalia.Api.Models;

namespace Marginalia.Api.Controllers;

[ApiController]
[Route("api/quotes")]
[Authorize]
public class QuotesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var quotes = await db.Quotes
            .AsNoTracking()
            .Where(q => q.UserId == userId)
            .OrderBy(q => q.CreatedAt)
            .ThenBy(q => q.Id)
            .Select(q => new QuoteResponse(q.Id, q.Text, q.Author))
            .ToListAsync(cancellationToken);

        return Ok(quotes);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] QuoteRequest request, CancellationToken cancellationToken)
    {
        if (!ValidateAndNormalize(request, out var text, out var author))
        {
            return ValidationProblem(ModelState);
        }

        var userId = User.GetUserId();

        var strategy = db.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);

            var count = await db.Quotes.CountAsync(q => q.UserId == userId, cancellationToken);
            if (count >= 5)
            {
                return Problem(
                    statusCode: StatusCodes.Status409Conflict,
                    title: "Conflict",
                    detail: "Du har nått maxgränsen på fem citat."
                );
            }

            var quote = new Quote
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Text = text,
                Author = author,
                CreatedAt = DateTime.UtcNow
            };

            db.Quotes.Add(quote);
            await db.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            var response = new QuoteResponse(quote.Id, quote.Text, quote.Author);
            return StatusCode(StatusCodes.Status201Created, response);
        });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update([FromRoute] Guid id, [FromBody] QuoteRequest request, CancellationToken cancellationToken)
    {
        if (!ValidateAndNormalize(request, out var text, out var author))
        {
            return ValidationProblem(ModelState);
        }

        var userId = User.GetUserId();
        var quote = await db.Quotes
            .SingleOrDefaultAsync(q => q.Id == id && q.UserId == userId, cancellationToken);

        if (quote is null)
        {
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Not Found",
                detail: "Citatet hittades inte"
            );
        }

        quote.Text = text;
        quote.Author = author;

        await db.SaveChangesAsync(cancellationToken);

        var response = new QuoteResponse(quote.Id, quote.Text, quote.Author);
        return Ok(response);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var quote = await db.Quotes
            .SingleOrDefaultAsync(q => q.Id == id && q.UserId == userId, cancellationToken);

        if (quote is null)
        {
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Not Found",
                detail: "Citatet hittades inte"
            );
        }

        db.Quotes.Remove(quote);
        await db.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    private bool ValidateAndNormalize(
        QuoteRequest? request,
        out string trimmedText,
        out string trimmedAuthor)
    {
        trimmedText = string.Empty;
        trimmedAuthor = string.Empty;

        if (request is null)
        {
            AddUniqueModelError(nameof(QuoteRequest.Text), "Ange citatet");
            AddUniqueModelError(nameof(QuoteRequest.Author), "Ange citatets författare");
            return false;
        }

        trimmedText = request.Text?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(request.Text))
        {
            AddUniqueModelError(nameof(QuoteRequest.Text), "Ange citatet");
        }
        else if (trimmedText.Length > 600)
        {
            AddUniqueModelError(nameof(QuoteRequest.Text), "Citatet får vara högst 600 tecken");
        }

        trimmedAuthor = request.Author?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(request.Author))
        {
            AddUniqueModelError(nameof(QuoteRequest.Author), "Ange citatets författare");
        }
        else if (trimmedAuthor.Length > 200)
        {
            AddUniqueModelError(nameof(QuoteRequest.Author), "Författaren får vara högst 200 tecken");
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
