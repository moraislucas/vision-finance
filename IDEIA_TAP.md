# Sistema de Registro Rápido de Transações via iPhone

## Objetivo

Implementar um sistema de registro rápido de transações financeiras para uso pessoal, integrado ao sistema financeiro desenvolvido em Vue 3 + Supabase.

O principal objetivo é reduzir ao máximo o atrito para registrar despesas e receitas no dia a dia, permitindo que um lançamento seja realizado em poucos segundos diretamente pelo iPhone através do aplicativo Atalhos (Shortcuts).

---

# Fluxo de Uso

## Cenário Principal

O usuário realiza uma compra ou recebe um valor.

Ao invés de abrir o sistema financeiro e navegar até a tela de lançamentos, ele executa um atalho do iPhone.

Fluxo:

1. Usuário dá dois toques atrás do iPhone (Back Tap).
2. O atalho é executado.
3. É exibido um formulário simples.
4. Usuário seleciona:

   * Receita
   * Despesa
5. Usuário informa o valor.
6. Usuário seleciona uma categoria.
7. O atalho envia os dados para uma API.
8. A API grava automaticamente no Supabase.
9. O lançamento aparece imediatamente no sistema.

Tempo estimado de uso: entre 2 e 5 segundos.

---

# Escopo da V1

## Cadastro de Transações

Cada transação deve possuir:

### Campos obrigatórios

* id
* type

  * income
  * expense
* amount
* category_id
* created_at

### Campos opcionais

* description
* notes

---

# Categorias

A V1 deve permitir categorias pré-cadastradas.

Exemplo:

### Receitas

* Salário
* Freelance
* Comissão
* Outros

### Despesas

* Mercado
* Alimentação
* Combustível
* Farmácia
* Assinaturas
* Lazer
* Casa
* Outros

---

# Arquitetura

## Frontend

* Vue 3
* Pinia
* Vue Router
* Tailwind CSS

## Backend

* Supabase

### Utilizar

* PostgreSQL
* Supabase Auth
* Edge Functions

---

# API para Registro Rápido

Criar uma Edge Function responsável por receber registros enviados pelos atalhos do iPhone.

## Endpoint

POST

/functions/v1/quick-transaction

---

## Payload

```json
{
  "token": "SECRET_TOKEN",
  "type": "expense",
  "amount": 38.90,
  "category": "Mercado",
  "description": "Compra semanal"
}
```

## Resposta

```json
{
  "success": true
}
```

---

# Segurança

Não deixar o endpoint totalmente aberto.

Implementar:

* Token secreto
* Validação do token na Edge Function
* Rejeitar requisições sem autenticação

Exemplo:

```json
{
  "error": "unauthorized"
}
```

---

# Integração com Atalhos do iPhone

## Atalho Principal

Nome:

Registrar Transação

---

### Etapa 1

Selecionar tipo

Opções:

* Receita
* Despesa

---

### Etapa 2

Informar valor

Exemplo:

38,90

---

### Etapa 3

Selecionar categoria

Exemplo:

* Mercado
* Alimentação
* Combustível
* Farmácia
* Lazer

---

### Etapa 4

Descrição (opcional)

---

### Etapa 5

Enviar POST para API

---

# Ativação por Back Tap

Configuração desejada:

Ajustes → Acessibilidade → Toque → Toque Atrás

Selecionar:

* Toque Duplo

ou

* Toque Triplo

Executando o atalho:

Registrar Transação

---

# Melhoria Opcional

Criar dois atalhos separados:

## Registrar Despesa

Fluxo:

Categoria → Valor → Enviar

---

## Registrar Receita

Fluxo:

Categoria → Valor → Enviar

---

Isso elimina a etapa de escolher entre receita e despesa e reduz ainda mais o tempo de registro.

---

# Melhoria Futura (V2)

Adicionar suporte a voz.

Exemplos:

"Mercado 120 reais"

"Gasolina 80 reais"

"Freelance 500 reais"

O sistema deverá interpretar automaticamente:

* Categoria
* Valor
* Tipo

e registrar a transação sem necessidade de preenchimento manual.

---

# Resultado Esperado

O usuário deve conseguir registrar qualquer gasto ou receita em menos de 5 segundos, sem abrir o sistema financeiro.

A experiência deve ser semelhante a registrar uma informação rapidamente no WhatsApp, porém salvando diretamente no banco de dados do sistema financeiro.
