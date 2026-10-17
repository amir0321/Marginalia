using System.ComponentModel.DataAnnotations;

namespace Marginalia.Api.Dtos;

public record RegisterRequest(
    [property: Required(ErrorMessage = "Ange ett användarnamn", AllowEmptyStrings = false)]
    [property: StringLength(30, MinimumLength = 3, ErrorMessage = "Användarnamnet måste vara mellan 3 och 30 tecken")]
    [property: RegularExpression(@"^[a-zA-Z0-9._-]+$", ErrorMessage = "Användarnamnet får bara innehålla bokstäver, siffror, punkt, understreck och bindestreck")]
    string Username,

    [property: Required(ErrorMessage = "Ange ett lösenord")]
    [property: MinLength(8, ErrorMessage = "Använd minst 8 tecken")]
    string Password
);

public record LoginRequest(
    [property: Required(ErrorMessage = "Ange ett användarnamn", AllowEmptyStrings = false)]
    string Username,

    [property: Required(ErrorMessage = "Ange ett lösenord")]
    [property: MinLength(8, ErrorMessage = "Använd minst 8 tecken")]
    string Password
);

public record AuthResponse(
    string Token,
    string Username,
    DateTime ExpiresAt
);
