using System.ComponentModel.DataAnnotations;
using Marginalia.Api.Dtos;

namespace Marginalia.Api.Tests;

public class AuthDtosTests
{
    private static IList<ValidationResult> ValidateModel(object model)
    {
        var validationResults = new List<ValidationResult>();
        var ctx = new ValidationContext(model, serviceProvider: null, items: null);
        Validator.TryValidateObject(model, ctx, validationResults, validateAllProperties: true);
        return validationResults;
    }

    [Fact]
    public void RegisterRequest_WithValidData_PassesValidation()
    {
        var request = new RegisterRequest("bokmalen", "hemligt123");
        var errors = ValidateModel(request);
        Assert.Empty(errors);
    }

    [Fact]
    public void RegisterRequest_WithShortPassword_FailsValidation()
    {
        var request = new RegisterRequest("bokmalen", "kort");
        var errors = ValidateModel(request);
        Assert.Contains(errors, e => e.ErrorMessage == "Använd minst 8 tecken");
    }

    [Fact]
    public void RegisterRequest_WithEmptyUsername_FailsValidation()
    {
        var request = new RegisterRequest("", "hemligt123");
        var errors = ValidateModel(request);
        Assert.Contains(errors, e => e.ErrorMessage == "Ange ett användarnamn");
    }

    [Fact]
    public void RegisterRequest_WithLongPassword_FailsValidation()
    {
        var request = new RegisterRequest("bokmalen", new string('a', 129));
        var errors = ValidateModel(request);
        Assert.Contains(errors, e => e.ErrorMessage == "Lösenordet får vara högst 128 tecken");
    }

    [Fact]
    public void LoginRequest_WithValidData_PassesValidation()
    {
        var request = new LoginRequest("bokmalen", "hemligt123");
        var errors = ValidateModel(request);
        Assert.Empty(errors);
    }

    [Fact]
    public void LoginRequest_WithShortPassword_FailsValidation()
    {
        var request = new LoginRequest("bokmalen", "123");
        var errors = ValidateModel(request);
        Assert.Contains(errors, e => e.ErrorMessage == "Använd minst 8 tecken");
    }

    [Fact]
    public void LoginRequest_WithLongPassword_FailsValidation()
    {
        var request = new LoginRequest("bokmalen", new string('a', 129));
        var errors = ValidateModel(request);
        Assert.Contains(errors, e => e.ErrorMessage == "Lösenordet får vara högst 128 tecken");
    }

    [Fact]
    public void LoginRequest_WithLongUsername_FailsValidation()
    {
        var request = new LoginRequest(new string('a', 31), "hemligt123");
        var errors = ValidateModel(request);
        Assert.Contains(errors, e => e.ErrorMessage == "Användarnamnet får vara högst 30 tecken");
    }
}
