package com.shopeelister.util

object CategoryData {
    val LEAF_CATEGORIES = listOf(
        // Papelaria
        101341L to "Papelaria/Escrita e Correção/Marca-texto",
        101338L to "Papelaria/Escrita e Correção/Lápis",
        101337L to "Papelaria/Escrita e Correção/Canetas e Tinteiros",
        101340L to "Papelaria/Escrita e Correção/Marcadores",
        101378L to "Papelaria/Cadernos e Papéis/Cadernos e Blocos de Notas",
        101359L to "Papelaria/Equipamento Escolar e de Escritório/Estojos de Lápis",
        // Beleza
        101630L to "Beleza/Maquiagem/Rosto/Pó",
        101635L to "Beleza/Maquiagem/Rosto/Outros",
        101627L to "Beleza/Maquiagem/Rosto/Base de Maquiagem e Primer",
        101639L to "Beleza/Maquiagem/Olhos/Máscara de Cílios",
        101616L to "Beleza/Cuidados Masculinos/Cuidados com a Pele/Limpador Facial",
        100869L to "Beleza/Cuidados com o Cabelo/Shampoo",
        101664L to "Beleza/Utensílios de Beleza/Utensílios Capilares/Escovas e Pentes",
        101636L to "Beleza/Maquiagem/Olhos/Sombra",
        101642L to "Beleza/Maquiagem/Lábios/Batom",
        // Moda
        100244L to "Roupas Masculinas/Blusas/Camisetas",
        100352L to "Roupas Femininas/Blusas/Camisetas",
        101032L to "Moda Infantil/Acessórios Infantis/Meias",
        101018L to "Moda Infantil/Roupas Infantis/Vestidos",
        101020L to "Moda Infantil/Roupas Infantis/Pijamas",
        100104L to "Roupas Femininas/Vestidos",
        // Casa e Decoração
        101158L to "Casa e Decoração/Decoração/Relógios",
        101163L to "Casa e Decoração/Decoração/Espelhos",
        101162L to "Casa e Decoração/Decoração/Velas e Castiçais",
        101176L to "Casa e Decoração/Jardinagem/Plantas Artificiais",
        101169L to "Casa e Decoração/Móveis/Escrivaninhas e Mesas",
        101240L to "Casa e Decoração/Louça/Copos e Taças",
        101243L to "Casa e Decoração/Louça/Pratos",
        101148L to "Casa e Decoração/Roupas de Cama/Lençóis e Fronhas",
        // Churrasco
        101223L to "Casa e Decoração/Artigos de Cozinha/Utensílios para Churrasco",
        // Eletrônicos / Games
        100073L to "Celulares e Dispositivos/Celulares",
        101078L to "Jogos e Consoles/Consoles/Switch",
        101073L to "Jogos e Consoles/Consoles/Playstation",
        101074L to "Jogos e Consoles/Consoles/Xbox",
        101944L to "Computadores e Acessórios/Computadores Desktop/Computador Desktop",
        101957L to "Computadores e Acessórios/Componentes/Gabinetes",
        // Hobbies
        101385L to "Hobbies e Coleções/Itens Colecionáveis/Figuras de Ação",
        101396L to "Hobbies e Coleções/Souvenirs/Chaveiros",
        // Brinquedos e Hobbies > Brinquedos Educativos
        100386L to "Brinquedos e Hobbies/Brinquedos Educativos/Jogos de Tabuleiro",
        100387L to "Brinquedos e Hobbies/Brinquedos Educativos/Quebra-cabeças",
        100388L to "Brinquedos e Hobbies/Brinquedos Educativos/Blocos de Montar",
        100385L to "Brinquedos e Hobbies/Brinquedos Educativos/Brinquedos para Bebês",
        100389L to "Brinquedos e Hobbies/Brinquedos Educativos/Outros",
        100390L to "Brinquedos e Hobbies/Brinquedos Educativos/Instrumentos Musicais Infantis",
        100391L to "Brinquedos e Hobbies/Brinquedos Educativos/Kits de Ciência",
        100392L to "Brinquedos e Hobbies/Brinquedos Educativos/Brinquedos para Areia e Água",
        // Mãe e Bebê
        100950L to "Mãe e Bebê/Coisas Essenciais para Viagens com Bebês/Bolsas de Fraldas",
        101708L to "Mãe e Bebê/Berçário/Colchões e Roupa de Cama/Lençóis"
    )
    
    fun findCategory(query: String): Pair<Long, String>? {
        if (query.isBlank()) return null
        
        // Clean query: remove ">", handle slashes, lowercase
        val cleanQuery = query.replace(">", "/").replace("  ", " ").trim().lowercase()
        
        // --- HARDCODED EXCEPTIONS (Priority 0) ---
        if (cleanQuery.contains("churrasco") || cleanQuery.contains("grelha")) {
            return 101223L to "Casa e Decoração/Artigos de Cozinha/Utensílios para Churrasco"
        }
        
        // Brinquedos Educativos - keywords prioritárias
        val educationalKeywords = listOf("jogo", "dominó", "domino", "educativo", "ingles", "inglês", "brinquedo", "criança", "infantil", "aprender", "ensinar", "memória", "memoria", "tabuleiro", "quebra-cabeça", "quebra cabeça")
        if (educationalKeywords.any { cleanQuery.contains(it) }) {
            return 100389L to "Brinquedos e Hobbies/Brinquedos Educativos/Outros"
        }
        
        // 1. Exact path match (Highest priority)
        LEAF_CATEGORIES.firstOrNull { it.second.equals(cleanQuery, ignoreCase = true) }?.let { return it }
        
        // 2. Full path contains match
        LEAF_CATEGORIES.firstOrNull { it.second.lowercase().contains(cleanQuery) }?.let { return it }
        
        // 3. Weighted multi-word match (Priority to more word overlaps)
        val queryWords = cleanQuery.split(" ", "/", ",").filter { it.length > 3 }
        if (queryWords.isEmpty()) return null

        return LEAF_CATEGORIES.map { cat ->
            val catWords = cat.second.lowercase().split(" ", "/", ",").filter { it.length > 3 }
            val matchCount = queryWords.count { qw -> catWords.any { cw -> cw.contains(qw) || qw.contains(cw) } }
            cat to matchCount
        }
        .filter { it.second > 0 }
        .maxByOrNull { it.second } // Get the one with most matches
        ?.first
    }
}
