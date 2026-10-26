using System.ComponentModel.DataAnnotations;
using Marginalia.Api.Dtos;

namespace Marginalia.Api.Tests;

public class QuoteDtosTests
{
    private static IList<ValidationResult> ValidateModel(object model)
    {
        var validationResults = new List<ValidationResult>();
        var ctx = new ValidationContext(model, serviceProvider: null, items: null);
        Validator.TryValidateObject(model, ctx, validationResults, validateAllProperties: true);
        return validationResults;
    }

    [Fact]
    public void QuoteRequest_WithValidData_PassesValidation()
    {
        var request = new QuoteRequest(
            "Det är inte lätt att vara människa.",
            "Astrid Lindgren"
        );

        var errors = ValidateModel(request);

        Assert.Empty(errors);
    }

    [Fact]
    public void QuoteRequest_WithMissingText_FailsValidation()
    {
        var request = new QuoteRequest(
            "",
            "Astrid Lindgren"
        );

        var errors = ValidateModel(request);

        Assert.Contains(errors, e => e.ErrorMessage == "Ange citatet");
    }

    [Fact]
    public void QuoteRequest_WithTextExceeding600Chars_FailsValidation()
    {
        var longText = new string('x', 601);
        var request = new QuoteRequest(
            longText,
            "Astrid Lindgren"
        );

        var errors = ValidateModel(request);

        Assert.Contains(errors, e => e.ErrorMessage == "Citatet får vara högst 600 tecken");
    }

    [Fact]
    public void QuoteRequest_WithMissingAuthor_FailsValidation()
    {
        var request = new QuoteRequest(
            "Det är inte lätt att vara människa.",
            ""
        );

        var errors = ValidateModel(request);

        Assert.Contains(errors, e => e.ErrorMessage == "Ange citatets författare");
    }

    [Fact]
    public void QuoteRequest_WithAuthorExceeding200Chars_FailsValidation()
    {
        var longAuthor = new string('y', 201);
        var request = new QuoteRequest(
            "Det är inte lätt att vara människa.",
            longAuthor
        );

        var errors = ValidateModel(request);

        Assert.Contains(errors, e => e.ErrorMessage == "Författaren får vara högst 200 tecken");
    }

    [Fact]
    public void QuoteRequest_DeconstructAndParameterlessConstructor_WorkCorrectly()
    {
        var request = new QuoteRequest
        {
            Text = "Visst gör det ont när knoppar brister",
            Author = "Karin Boye"
        };

        var (text, author) = request;

        Assert.Equal("Visst gör det ont när knoppar brister", text);
        Assert.Equal("Karin Boye", author);
    }

    [Fact]
    public void QuoteResponse_RecordProperties_MatchContractWithoutExposingEntitiesOrUserId()
    {
        var id = Guid.NewGuid();
        var response = new QuoteResponse(id, "Tankar i en skog", "Harry Martinson");

        Assert.Equal(id, response.Id);
        Assert.Equal("Tankar i en skog", response.Text);
        Assert.Equal("Harry Martinson", response.Author);

        var properties = typeof(QuoteResponse).GetProperties();
        Assert.Equal(3, properties.Length);
        Assert.Contains(properties, p => p.Name == nameof(QuoteResponse.Id));
        Assert.Contains(properties, p => p.Name == nameof(QuoteResponse.Text));
        Assert.Contains(properties, p => p.Name == nameof(QuoteResponse.Author));
        Assert.DoesNotContain(properties, p => p.Name.Contains("User", StringComparison.OrdinalIgnoreCase));
    }
}
