$destino = "extraidos"
$raiz = Get-Location

# Limpa destino anterior
if (Test-Path $destino) { Remove-Item -Recurse -Force $destino }
New-Item -ItemType Directory -Path $destino | Out-Null

# Lista negra de pastas
$pastasProibidas = @("node_modules", ".next", ".git", ".idea", ".husky", "projeto_extraido", "extraidos")

Get-ChildItem -Recurse -File | ForEach-Object {
    $arquivo = $_

    # Verifica se o caminho contém alguma pasta proibida
    $caminhoValido = $true
    foreach ($pasta in $pastasProibidas) {
        if ($arquivo.FullName -match "\\$([regex]::Escape($pasta))\\") {
            $caminhoValido = $false
            break
        }
    }

    if ($caminhoValido -and $arquivo.Name -ne "package-lock.json" -and $arquivo.Name -ne "extrair_projeto.ps1") {
        $caminhoRelativo = $arquivo.FullName.Replace("$raiz\", "")
        # Substitui colchetes por parenteses para evitar conflito com wildcards
        $nomeLimpo = $caminhoRelativo.Replace("\", "_").Replace("[", "(").Replace("]", ")")

        $destinoFinal = Join-Path $destino $nomeLimpo

        # Garante que o diretório existe
        $dirDestino = Split-Path $destinoFinal -Parent
        if (!(Test-Path $dirDestino)) {
            # Não precisa criar, arquivo está na raiz do destino
        }

        # Usa caminho literal (escapando wildcards)
        $conteudo = Get-Content -LiteralPath $arquivo.FullName -Raw
        "// Caminho original: $caminhoRelativo`n`n" | Out-File -LiteralPath $destinoFinal -Encoding UTF8 -NoNewline
        $conteudo | Out-File -LiteralPath $destinoFinal -Append -Encoding UTF8

        Write-Host "OK: $nomeLimpo"
    }
}

Write-Host "`nPronto! Total de arquivos em: $destino"