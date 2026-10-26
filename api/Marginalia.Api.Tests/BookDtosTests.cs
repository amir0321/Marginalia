using System.ComponentModel.DataAnnotations;
using Marginalia.Api.Dtos;

namespace Marginalia.Api.Tests;

public class BookDtosTests
{
    private static IList<ValidationResult> ValidateModel(object model)
    {
        var validationResults = new List<ValidationResult>();
        var ctx = new ValidationContext(model, serviceProvider: null, items: null);
        Validator.TryValidateObject(model, ctx, validationResults, validateAllProperties: true);
        return validationResults;
    }

    [Fact]
    public void BookRequest_WithValidDataAndDescription_PassesValidation()
    {
        var request = new BookRequest(
            "Ett eget rum",
            "Virginia Woolf",
            new DateOnly(1929, 9, 24),
            "En essä om kvinnors skapande och självständighet."
        );

        var errors = ValidateModel(request);

        Assert.Empty(errors);
    }

    [Fact]
    public void BookRequest_WithValidDataWithoutDescription_PassesValidation()
    {
        var request = new BookRequest(
            "Kallocain",
            "Karin Boye",
            new DateOnly(1940, 10, 1),
            description: null
        );

        var errors = ValidateModel(request);

        Assert.Empty(errors);
    }

    [Fact]
    public void BookRequest_WithMissingTitle_FailsValidation()
    {
        var request = new BookRequest(
            "",
            "Virginia Woolf",
            new DateOnly(1929, 9, 24)
        );

        var errors = ValidateModel(request);

        Assert.Contains(errors, e => e.ErrorMessage == "Ange bokens titel");
    }

    [Fact]
    public void BookRequest_WithTitleExceeding200Chars_FailsValidation()
    {
        var longTitle = new string('a', 201);
        var request = new BookRequest(
            longTitle,
            "Virginia Woolf",
            new DateOnly(1929, 9, 24)
        );

        var errors = ValidateModel(request);

        Assert.Contains(errors, e => e.ErrorMessage == "Titeln får vara högst 200 tecken");
    }

    [Fact]
    public void BookRequest_WithMissingAuthor_FailsValidation()
    {
        var request = new BookRequest(
            "Ett eget rum",
            "",
            new DateOnly(1929, 9, 24)
        );

        var errors = ValidateModel(request);

        Assert.Contains(errors, e => e.ErrorMessage == "Ange bokens författare");
    }

    [Fact]
    public void BookRequest_WithAuthorExceeding200Chars_FailsValidation()
    {
        var longAuthor = new string('b', 201);
        var request = new BookRequest(
            "Ett eget rum",
            longAuthor,
            new DateOnly(1929, 9, 24)
        );

        var errors = ValidateModel(request);

        Assert.Contains(errors, e => e.ErrorMessage == "Författaren får vara högst 200 tecken");
    }

    [Fact]
    public void BookRequest_WithMissingPublishedDate_FailsValidation()
    {
        var request = new BookRequest(
            "Ett eget rum",
            "Virginia Woolf",
            publishedDate: null
        );

        var errors = ValidateModel(request);

        Assert.Contains(errors, e => e.ErrorMessage == "Välj ett publiceringsdatum");
    }

    [Fact]
    public void BookRequest_WithDescriptionExceeding500Chars_FailsValidation()
    {
        var longDescription = new string('c', 501);
        var request = new BookRequest(
            "Ett eget rum",
            "Virginia Woolf",
            new DateOnly(1929, 9, 24),
            longDescription
        );

        var errors = ValidateModel(request);

        Assert.Contains(errors, e => e.ErrorMessage == "Beskrivningen får vara högst 500 tecken");
    }

    [Fact]
    public void BookRequest_DeconstructAndParameterlessConstructor_WorkCorrectly()
    {
        var request = new BookRequest
        {
            Title = "Aniara",
            Author = "Harry Martinson",
            PublishedDate = new DateOnly(1956, 1, 1),
            Description = "Rymdepos"
        };

        var (title, author, publishedDate, description) = request;

        Assert.Equal("Aniara", title);
        Assert.Equal("Harry Martinson", author);
        Assert.Equal(new DateOnly(1956, 1, 1), publishedDate);
        Assert.Equal("Rymdepos", description);
    }

    [Fact]
    public void BookResponse_RecordProperties_MatchContractWithoutExposingEntitiesOrUserId()
    {
        var id = Guid.NewGuid();
        var publishedDate = new DateOnly(1929, 9, 24);
        var response = new BookResponse(id, "Ett eget rum", "Virginia Woolf", publishedDate, "Klassiker");

        Assert.Equal(id, response.Id);
        Assert.Equal("Ett eget rum", response.Title);
        Assert.Equal("Virginia Woolf", response.Author);
        Assert.Equal(publishedDate, response.PublishedDate);
        Assert.Equal("Klassiker", response.Description);
    }
}
