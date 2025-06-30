
# 🔐 License Key API & Application Panel

API para registro, login, gerenciamento de licenças e uploads de arquivos, com suporte a HWID, sistema de painéis e verificação de aplicativos. Ideal para software com controle de chave de ativação e painel de administração.

## 📁 Estrutura

- `api/`: Endpoints REST para autenticação, licenças, arquivos.
- `public/`: Páginas HTML do painel.
- `archives/`: Diretório onde arquivos enviados são armazenados.
- `arquivos.json`: Registro dos arquivos enviados.
- `db.js`: Conexão com banco de dados MySQL.

---

## 🚀 Endpoints Principais

### 🧾 Autenticação

#### POST `/api/register`
Registra um usuário com chave de licença.

**Body:**
```json
{
  "email": "user@email.com",
  "password": "senha123",
  "key": "diario-XXXXXX",
  "hwid": "123456789"
}
```

#### POST `/api/login`
Login usando email, senha e HWID.

**Body:**
```json
{
  "email": "user@email.com",
  "password": "senha123",
  "hwid": "123456789"
}
```

#### POST `/api/reset-hwid`
Reseta HWID de uma chave.

**Body:**
```json
{ "key": "diario-XXXXXX" }
```

---

## 🔁 Renovação e Ativação

#### POST `/api/renew`
Renova uma aplicação com nova chave.

**Body:**
```json
{ "user_id": 1, "key": "mensal-XXXXXX" }
```

#### POST `/api/activeKey`
Ativa nova chave para o app.

**Body:**
```json
{
  "user_id": 1,
  "key": "diario-XXXXXX",
  "app": "aim-assist"
}
```

---

## ✅ Verificação

#### POST `/api/verifyApp`
Verifica se o usuário possui permissão no app.

**Body:**
```json
{ "user_id": 1, "app": "aim-assist" }
```

---

## 🧪 Licenças

#### POST `/api/generate-keys`
Gera chaves com tipo e app definido.

**Body:**
```json
{
  "key_type": "mensal",
  "quantity": 5,
  "admin": true,
  "app": "aim-assist"
}
```

#### GET `/api/get-hwid-vazio`
Busca todas as licenças sem HWID.

#### POST `/api/delete-hwid-vazio`
Remove todas as licenças sem HWID.

#### POST `/api/delete-key`
Deleta uma chave manualmente.

**Body:**
```json
{ "key": "mensal-XXXXXX" }
```

---

## 📦 Upload de Arquivos

#### POST `/upload`
Envia um arquivo vinculado a um usuário.

**FormData:**
- `file`: arquivo
- `user`: id do usuário

#### GET `/files`
Lista todos os arquivos enviados.

#### GET `/files/:filename`
Baixa um arquivo específico.

#### DELETE `/files/:filename`
Deleta um arquivo por nome.

#### GET `/last-file`
Retorna o último arquivo enviado.

---

## 🖥️ Painel HTML

- `/painel/admin/key/melhoraim`
- `/painel/red/key/melhoraim`
- `/upload/key/melhoraim`
- `/files/key/melhoraim`
- `/last-file/key/melhoraim`

---

## ⚙️ Configuração

- Porta: `3063`
- Webhook Discord: Configurar em `webhookURL`
- Banco de dados: MySQL (ver `db.js`)

---

## 📌 Tipos de Licença

- `1hora`: +1h
- `diario`: +24h
- `semanal`: +168h
- `quinzenal`: +360h
- `mensal`: +730h
- `trimestral`: +2190h
- `permanente`: "9999-12-31 23:59:59"

---

## 🧠 Tecnologias

- Node.js
- Express
- MySQL
- Multer
- Axios
- bcryptjs
- moment-timezone
- fs

---

## 📜 Licença

Este projeto é apenas para fins educacionais. Uso comercial sem autorização é proibido.
