using Npgsql;

// Classe estática = não precisa instanciar, chama direto: DbConnection.Criar()
public static class DbConnection
{
    private static string _connStr = string.Empty;

    // Chamado uma vez ao iniciar o servidor
    public static void Inicializar(string connStr) => _connStr = connStr;

    // Cria e retorna uma nova conexão com o banco
    public static NpgsqlConnection Criar() => new NpgsqlConnection(_connStr);
}