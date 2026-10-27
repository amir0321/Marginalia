using Microsoft.EntityFrameworkCore;
using Marginalia.Api.Models;

namespace Marginalia.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Book> Books => Set<Book>();
    public DbSet<Quote> Quotes => Set<Quote>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(u =>
        {
            u.HasKey(x => x.Id);
            u.Property(x => x.Id).ValueGeneratedOnAdd();
            u.Property(x => x.Username).IsRequired().HasMaxLength(30);
            u.Property(x => x.UsernameNormalized).IsRequired().HasMaxLength(30);
            u.HasIndex(x => x.UsernameNormalized).IsUnique();
            u.Property(x => x.PasswordHash).IsRequired();
            u.Property(x => x.CreatedAt).IsRequired();
        });

        modelBuilder.Entity<Book>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Id).ValueGeneratedOnAdd();
            b.Property(x => x.UserId).IsRequired();
            b.Property(x => x.Title).IsRequired().HasMaxLength(200);
            b.Property(x => x.Author).IsRequired().HasMaxLength(200);
            b.Property(x => x.PublishedDate).IsRequired();
            b.Property(x => x.Description).HasMaxLength(500);
            b.Property(x => x.CreatedAt).IsRequired();
            b.HasIndex(x => x.UserId);
            b.HasOne(x => x.User)
             .WithMany(u => u.Books)
             .HasForeignKey(x => x.UserId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Quote>(q =>
        {
            q.HasKey(x => x.Id);
            q.Property(x => x.Id).ValueGeneratedOnAdd();
            q.Property(x => x.UserId).IsRequired();
            q.Property(x => x.Text).IsRequired().HasMaxLength(600);
            q.Property(x => x.Author).IsRequired().HasMaxLength(200);
            q.Property(x => x.CreatedAt).IsRequired();
            q.HasIndex(x => x.UserId);
            q.HasOne(x => x.User)
             .WithMany(u => u.Quotes)
             .HasForeignKey(x => x.UserId)
             .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
