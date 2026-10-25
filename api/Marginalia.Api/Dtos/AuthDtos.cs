using System.ComponentModel.DataAnnotations;

namespace Marginalia.Api.Dtos;

public record RegisterRequest
{
    [Required(ErrorMessage = "Ange ett användarnamn", AllowEmptyStrings = false)]
    [StringLength(30, MinimumLength = 3, ErrorMessage = "Användarnamnet måste vara mellan 3 och 30 tecken")]
    [RegularExpression(@"^[a-zA-Z0-9._-]+$", ErrorMessage = "Användarnamnet får bara innehålla bokstäver, siffror, punkt, understreck och bindestreck")]
    public string Username { get; init; } = string.Empty;

    [Required(ErrorMessage = "Ange ett lösenord")]
    [MinLength(8, ErrorMessage = "Använd minst 8 tecken")]
    public string Password { get; init; } = string.Empty;

    public RegisterRequest() { }

    public RegisterRequest(string username, string password)
    {
        Username = username;
        Password = password;
    }

    public void Deconstruct(out string username, out string password)
    {
        username = Username;
        password = Password;
    }
}

public record LoginRequest
{
    [Required(ErrorMessage = "Ange ett användarnamn", AllowEmptyStrings = false)]
    public string Username { get; init; } = string.Empty;

    [Required(ErrorMessage = "Ange ett lösenord")]
    [MinLength(8, ErrorMessage = "Använd minst 8 tecken")]
    public string Password { get; init; } = string.Empty;

    public LoginRequest() { }

    public LoginRequest(string username, string password)
    {
        Username = username;
        Password = password;
    }

    public void Deconstruct(out string username, out string password)
    {
        username = Username;
        password = Password;
    }
}

public record AuthResponse(
    string Token,
    string Username,
    DateTime ExpiresAt
);
