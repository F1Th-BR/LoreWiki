using DbUp;
using Dapper;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Faz o Dapper entender colunas snake_case (password_hash) 
// e mapear pra propriedades PascalCase (PasswordHash)
Dapper.DefaultTypeMap.MatchNamesWithUnderscores = true;

var connStr = builder.Configuration.GetConnectionString("Default")!;

// ── Registra serviços no container de injeção de dependência ──
builder.Services.AddSingleton<AuthService>();
builder.Services.AddSingleton<RbacService>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Secret"]!)),
            ValidateIssuer = false,
            ValidateAudience = false
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

DbConnection.Inicializar(connStr);

// ── Roda as migrations ao iniciar ──────────────────────────
var resultado = DeployChanges.To
    .PostgresqlDatabase(connStr)
    .WithScriptsFromFileSystem("Migrations")
    .LogToConsole()
    .Build()
    .PerformUpgrade();

if (!resultado.Successful)
    throw new Exception("Falha na migration: " + resultado.Error);

// ── Middlewares de autenticação (ORDEM IMPORTA) ────────────
app.UseAuthentication();
app.UseAuthorization();

app.UseStaticFiles();

// ── Rotas ───────────────────────────────────────────────────
app.MapGet("/", () => "LoreWiki API rodando!");

app.MapGet("/teste-db", async () =>
{
    using var conn = DbConnection.Criar();
    var usuarios = await conn.QueryAsync<User>("SELECT * FROM users");
    return Results.Ok(usuarios);
});

AuthEndpoints.MapRoutes(app);
WorldsEndpoints.MapRoutes(app);
PagesEndpoints.MapRoutes(app);
CampaignsEndpoints.MapRoutes(app);
PlayerLinksEndpoints.MapRoutes(app);
ImagesEndpoints.MapRoutes(app);

app.Run();