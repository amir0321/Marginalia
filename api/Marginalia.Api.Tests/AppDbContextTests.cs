using System.ComponentModel.DataAnnotations;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Marginalia.Api.Data;
using Marginalia.Api.Models;

namespace Marginalia.Api.Tests;

public sealed class AppDbContextTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly AppDbContext _db;

    public AppDbContextTests()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;

        _db = new AppDbContext(options);
        _db.Database.EnsureCreated();
    }

    public void Dispose()
    {
        _db.Dispose();
        _connection.Dispose();
    }

    [Fact]
    public void Model_HasNoPendingMigrations()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql("Host=localhost;Database=marginalia_test")
            .Options;

        using var npgsqlDb = new AppDbContext(options);
        Assert.False(npgsqlDb.Database.HasPendingModelChanges());
    }

    [Fact]
    public void UserModel_EnforcesContractMaxLengths_Nullability_AndUniqueNormalizedUsernameIndex()
    {
        var entity = _db.Model.FindEntityType(typeof(User));
        Assert.NotNull(entity);

        var username = entity.FindProperty(nameof(User.Username));
        Assert.NotNull(username);
        Assert.False(username.IsNullable);
        Assert.Equal(30, username.GetMaxLength());

        var usernameNormalized = entity.FindProperty(nameof(User.UsernameNormalized));
        Assert.NotNull(usernameNormalized);
        Assert.False(usernameNormalized.IsNullable);
        Assert.Equal(30, usernameNormalized.GetMaxLength());

        var passwordHash = entity.FindProperty(nameof(User.PasswordHash));
        Assert.NotNull(passwordHash);
        Assert.False(passwordHash.IsNullable);

        var uniqueIndex = entity.GetIndexes()
            .SingleOrDefault(i => i.Properties.Select(p => p.Name).SequenceEqual([nameof(User.UsernameNormalized)]));
        Assert.NotNull(uniqueIndex);
        Assert.True(uniqueIndex.IsUnique);
    }

    [Fact]
    public void BookModel_EnforcesContractMaxLengths_OptionalDescription_AndUserIdIndex()
    {
        var entity = _db.Model.FindEntityType(typeof(Book));
        Assert.NotNull(entity);

        var title = entity.FindProperty(nameof(Book.Title));
        Assert.NotNull(title);
        Assert.False(title.IsNullable);
        Assert.Equal(200, title.GetMaxLength());

        var author = entity.FindProperty(nameof(Book.Author));
        Assert.NotNull(author);
        Assert.False(author.IsNullable);
        Assert.Equal(200, author.GetMaxLength());

        var description = entity.FindProperty(nameof(Book.Description));
        Assert.NotNull(description);
        Assert.True(description.IsNullable);
        Assert.Equal(500, description.GetMaxLength());

        var userIdIndex = entity.GetIndexes()
            .SingleOrDefault(i => i.Properties.Select(p => p.Name).SequenceEqual([nameof(Book.UserId)]));
        Assert.NotNull(userIdIndex);

        var fk = entity.GetForeignKeys()
            .SingleOrDefault(f => f.PrincipalEntityType.ClrType == typeof(User));
        Assert.NotNull(fk);
        Assert.Equal(DeleteBehavior.Cascade, fk.DeleteBehavior);
    }

    [Fact]
    public void QuoteModel_EnforcesContractMaxLengths_Nullability_AndUserIdIndex()
    {
        var entity = _db.Model.FindEntityType(typeof(Quote));
        Assert.NotNull(entity);

        var text = entity.FindProperty(nameof(Quote.Text));
        Assert.NotNull(text);
        Assert.False(text.IsNullable);
        Assert.Equal(600, text.GetMaxLength());

        var author = entity.FindProperty(nameof(Quote.Author));
        Assert.NotNull(author);
        Assert.False(author.IsNullable);
        Assert.Equal(200, author.GetMaxLength());

        var userIdIndex = entity.GetIndexes()
            .SingleOrDefault(i => i.Properties.Select(p => p.Name).SequenceEqual([nameof(Quote.UserId)]));
        Assert.NotNull(userIdIndex);

        var fk = entity.GetForeignKeys()
            .SingleOrDefault(f => f.PrincipalEntityType.ClrType == typeof(User));
        Assert.NotNull(fk);
        Assert.Equal(DeleteBehavior.Cascade, fk.DeleteBehavior);
    }

    [Fact]
    public async Task UniqueUsernameNormalizedIndex_RejectsDuplicateNormalizedUsername()
    {
        _db.Users.Add(new User
        {
            Username = "Bokmalen",
            UsernameNormalized = "BOKMALEN",
            PasswordHash = "hash-1"
        });
        await _db.SaveChangesAsync();

        _db.Users.Add(new User
        {
            Username = "bokmalen",
            UsernameNormalized = "BOKMALEN",
            PasswordHash = "hash-2"
        });

        await Assert.ThrowsAsync<DbUpdateException>(() => _db.SaveChangesAsync());
    }

    [Fact]
    public async Task Entities_PersistDateOnly_OptionalDescription_AndUtcCreatedAt()
    {
        var user = new User
        {
            Username = "lasare",
            UsernameNormalized = "LASARE",
            PasswordHash = "hash"
        };
        var book = new Book
        {
            User = user,
            Title = "Kallocain",
            Author = "Karin Boye",
            PublishedDate = new DateOnly(1940, 10, 1),
            Description = null
        };
        var quote = new Quote
        {
            User = user,
            Text = "Visst gör det ont när knoppar brister.",
            Author = "Karin Boye"
        };

        Assert.Equal(DateTimeKind.Utc, user.CreatedAt.Kind);
        Assert.Equal(DateTimeKind.Utc, book.CreatedAt.Kind);
        Assert.Equal(DateTimeKind.Utc, quote.CreatedAt.Kind);

        _db.Users.Add(user);
        _db.Books.Add(book);
        _db.Quotes.Add(quote);
        await _db.SaveChangesAsync();

        var savedBook = await _db.Books.AsNoTracking().SingleAsync(b => b.Id == book.Id);
        Assert.Equal(new DateOnly(1940, 10, 1), savedBook.PublishedDate);
        Assert.Null(savedBook.Description);
    }

    [Fact]
    public async Task DeletingUser_CascadesToBooksAndQuotes()
    {
        var user = new User
        {
            Username = "bokvannen",
            UsernameNormalized = "BOKVANNEN",
            PasswordHash = "hash"
        };
        _db.Users.Add(user);
        _db.Books.Add(new Book
        {
            User = user,
            Title = "Doktor Glas",
            Author = "Hjalmar Söderberg",
            PublishedDate = new DateOnly(1905, 1, 1),
            Description = "Dagboksroman"
        });
        _db.Quotes.Add(new Quote
        {
            User = user,
            Text = "Man vill bli älskad, i brist därpå beundrad.",
            Author = "Hjalmar Söderberg"
        });
        await _db.SaveChangesAsync();

        _db.Users.Remove(user);
        await _db.SaveChangesAsync();

        Assert.Empty(await _db.Books.ToListAsync());
        Assert.Empty(await _db.Quotes.ToListAsync());
    }

    [Fact]
    public void UserEntity_DataAnnotations_RejectUsernameLongerThan30Chars()
    {
        var tooLong = new string('a', 31);
        var user = new User
        {
            Username = tooLong,
            UsernameNormalized = tooLong.ToUpperInvariant(),
            PasswordHash = "hash"
        };

        var results = new List<ValidationResult>();
        var isValid = Validator.TryValidateObject(user, new ValidationContext(user), results, validateAllProperties: true);

        Assert.False(isValid);
        Assert.Contains(results, r => r.MemberNames.Contains(nameof(User.Username)));
        Assert.Contains(results, r => r.MemberNames.Contains(nameof(User.UsernameNormalized)));
    }
}
