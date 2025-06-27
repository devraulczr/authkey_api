import express from 'express';
import moment from 'moment-timezone';
import chalk from 'chalk';
import bcrypt from 'bcryptjs';
import axios from 'axios';
import multer from 'multer';
import { db } from './db.js';
import fs from 'fs/promises';
import path from 'path';
import fs2 from 'fs';

const PORT = 3063;
const DISCORD = 'discord.gg/uWdpNXpXuj';
let useApplication = true;

const app = express();
const webhookURL = 'https://discord.com/api/webhooks/xxxxxxxx/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

const avaibleApps = [
  "aim-assist"
];


const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'archives'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// STATIC ROUTES \\

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/painel/admin/key/melhoraim', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'painel.html'));
});

app.get('/painel/red/key/melhoraim', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pk.html'));
});

app.get('/upload/key/melhoraim', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'upload.html'));
});

app.get('/files/key/melhoraim', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'files.html'));
});

app.get('/last-file/key/melhoraim', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'last-file.html'));
});

const upload = multer({ storage: storage });

// FUNCTIONS \\

function formatDate(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function getDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function compareDates(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);

    if (isNaN(d1) || isNaN(d2)) {
        throw new Error("Invalid date format. Use 'YYYY-MM-DD HH:MM:SS'");
    }

    if (d1 > d2) {
        return 1;
    } else if (d1 < d2) {
        return -1;
    } else {
        return 0;
    }
}

function incrementDateHours(dateString, hours) {
    const date = new Date(dateString);
    date.setHours(date.getHours() + hours);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hoursFormatted = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hoursFormatted}:${minutes}:${seconds}`;
}

async function addApplication(userId, key_type, application, res) {
  try {
    let expire_date;
    switch (key_type) {
      case 'permanente':
          expire_date = "9999-12-31 23:59:59";
          break;
      case '1hora':
          expire_date = incrementDateHours(getDate(), 1);
          break;
      case 'diario':
          expire_date = incrementDateHours(getDate(), 24);
          break;
      case 'semanal':
          expire_date = incrementDateHours(getDate(), 168);
          break;
      case 'quinzenal':
          expire_date = incrementDateHours(getDate(), 360);
          break;
      case 'mensal':
          expire_date = incrementDateHours(getDate(), 730);
          break;
      case 'trimestral':
          expire_date = incrementDateHours(getDate(), 2190);
          break;
      default:
          return res.status(400).json({ message: 'Invalid key type' });
    }

    const [rows] = await db.query('SELECT id FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) {
      return false;
    }

    await db.query(
      'INSERT INTO application (application, expire_at, user_id) VALUES (?, ?, ?)',
      [application, expire_date, userId]
    );

    return res.status(200).json({ message: 'Aplicação adicionada com sucesso.' });

  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      return res.status(500).json({ message: 'Erro ao adicionar aplicação.', error: err.message });
    } else {
      console.warn("Resposta já foi enviada anteriormente, mas ocorreu um erro.");
    }
  }
}

// MAIN AUTH \\

app.post('/api/register', async (req, res) => {
  const { email, password, key, hwid } = req.body;

  if (!email || !password || !key || !hwid || email == "" || password == "" || key == "" || hwid == "") {
    return res.status(403).json({ error: "All fields are required" });
  }

  try {
    const [keyResult] = await db.query(
      'SELECT * FROM license_keys WHERE license_key = ?',
      [key]
    );

    if (keyResult.length === 0) {
      return res.status(403).json({ error: "Invalid license key" });
    }

    const [emailResult] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (emailResult.length > 0) {
      return res.status(403).json({ error: "Email is already registered" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const [user] = await db.query(
      'INSERT INTO users (email, password, hwid) VALUES (?, ?, ?)',
      [email, hashedPassword, hwid]
    );
    var userId = user.insertId;
    addApplication(userId, keyResult[0].key_type, keyResult[0].app, res);

    await db.query(
      'DELETE FROM license_keys WHERE license_key = ?',
      [key]
    );
    return res.status(200).json({
      message: "User registered successfully",
      user: user.insertId
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post('/api/renew', async (req, res) => {
  const {user_id, key} = req.body;
  
  try {
    const [keyResult] = await db.query(
      'SELECT * FROM license_keys WHERE license_key = ?',
      [key]
    );
    if (keyResult.length === 0) {
      return res.status(404).json({ error: 'Chave de licença inválida' });
    }

    const [currentAPP] = await db.query(
      'SELECT * FROM application WHERE user_id = ? and application = ?',
      [user_id, keyResult[0]["app"]]
    );

    if (currentAPP.length === 0) {
      return res.status(400).json({ error: 'Nenhum aplicação encontrada para esta key'});
    }
    const data_h = currentAPP[0]["expire_at"];
    const key_type = keyResult[0]["key_type"];
    const data = formatDate(data_h);
    let expire_date;
    switch (key_type) {
      case '1hora':
          expire_date = incrementDateHours(data, 1);
          break;
      case 'diario':
          expire_date = incrementDateHours(data, 24);
          break;
      case 'semanal':
          expire_date = incrementDateHours(data, 168);
          break;
      case 'quinzenal':
          expire_date = incrementDateHours(data, 360);
          break;
      case 'mensal':
          expire_date = incrementDateHours(data, 730);
          break;
      case 'trimestral':
          expire_date = incrementDateHours(data, 2190);
          break;
      case 'permanente':
          expire_date = "9999-12-31 23:59:59";
          break;
      default:
          return res.status(400).json({ message: 'Invalid key type' });
    }
    await db.query(
      'UPDATE application SET expire_at = ?',
      [expire_date]
    );
    await db.query(
      'DELETE FROM license_keys WHERE license_key = ?',
      [key]
    );
    res.status(200).json({message: "Key renew sucefull"});
  } catch (error) {
    res.status(500).json({error: `Internal error: ${error}`});
  }
})

app.post('/api/login', async (req, res) => {
  const { email, password, hwid } = req.body;

  try {
    const [user] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (user.length === 0) {
      return res.status(404).json({ error: "Invalid email" });
    }
    if (user[0]["hwid"] != hwid) {
      return res.status(403).json({error: "Hwid não autorizado"});
      
    }
    const isPass = await bcrypt.compare(password, user[0]["password"]);
    if (!isPass) {
      res.status(403).json({error: "Incorrect password"});
    }
    const [apps] = await db.query(
      'SELECT * FROM application WHERE user_id = ?',
      [user[0]["id"]]
    );
    res.status(200).json({user: user[0]});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post('/api/verifyApp', async (req, res) => {
  try {
    const { user_id, app } = req.body;

    if (!avaibleApps.includes(app)) {
      return res.status(404).json({ error: "App not found" });
    }

    const [appResult] = await db.query(
      'SELECT * FROM application WHERE user_id = ? AND application = ?',
      [user_id, app]
    );

    if (appResult.length === 0) {
      return res.status(403).json({ error: "User not have application" });
    }

    const expireDate = formatDate(appResult[0]["expire_at"]);
    const currentDate = getDate();

    if (compareDates(currentDate, expireDate) === 1) {
      return res.status(405).json({ error: "Expired license" });
    }

    return res.status(200).json({ message: "User have application" });

  } catch (err) {
    console.error("Erro no /api/verifyApp:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});
app.post('/api/activeKey', async (req, res) => {
  const {user_id, key, app} = req.body;
  try {
    const [keyResult] = await db.query(
      'SELECT * FROM license_keys WHERE license_key = ?',
      [key]
    );
    if (keyResult.length === 0) {
      return res.status(404).json({ error: 'Invalid license key' });
    }
    console.log(keyResult[0]);
    if (keyResult[0]["app"] != app) {
      return res.status(403).json({erro: "Please use a license key for your app"})
    }
    addApplication(user_id, keyResult[0]["key_type"], app, res)
    await db.query(
      'DELETE FROM license_keys WHERE id = ?',
      [keyResult[0]["id"]]
    );
    return res.status(200).json({message: "You sucefull actived your key"});
  } catch (error) {
    console.log("Erro interno");
    return res.status(500).json({erro: "Internal server error : " + error});
  }
})

// PANEL SYSTEM \\

app.post('/api/reset-hwid', async (req, res) => {
  const { key } = req.body;

  if (!key) {
    return res.status(400).json({ error: 'License Key é obrigatória.' });
  }

  try {
    const [result] = await db.query('UPDATE license_keys SET hwid = NULL WHERE license_key = ?', [key]);

    if (result.affectedRows > 0) {
      res.status(200).json({ message: `HWID da chave '${key}' resetado com sucesso.` });
    } else {
      res.status(404).json({ error: 'License Key não encontrada.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao resetar HWID.' });
  }
});

app.post('/api/generate-keys', async (req, res) => {
  const { key_type, quantity, admin, app } = req.body;
  if (!admin) {
    const payload = {
      username: 'PK',
      avatar_url: 'https://i.imgur.com/AfFp7pu.png',
      content: `🔐 O usuário *PK* criou **${quantity}** key do tipo **${key_type}**.`
    };

    try {
      await axios.post(webhookURL, payload);
      console.log('Mensagem enviada com sucesso!');
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err.message);
    }
  }

  if (!key_type || !quantity) {
    return res.status(400).json({ error: 'Tipo de chave e quantidade são obrigatórios.' });
  }

  try {
    const keys = [];
    for (let i = 0; i < quantity; i++) {
      const random_part = Math.random().toString(36).substring(2, 10).toUpperCase();
      const key = `${key_type}-${random_part}`;

      await db.query('INSERT INTO license_keys (license_key, key_type, app) VALUES (?, ?, ?)', [key, key_type, app]);
      keys.push(key);
    }

    res.status(200).json({ message: 'Chaves geradas com sucesso!', keys });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao gerar chaves.' });
  }
});

app.get('/api/get-hwid-vazio', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT license_key FROM license_keys WHERE hwid IS NULL');
    const keys = rows.map(row => row.license_key);
    res.status(200).json({ keys });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar HWID vazio.' });
  }
});

app.post('/api/delete-hwid-vazio', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM license_keys WHERE hwid IS NULL');
    
    if (result.affectedRows > 0) {
      res.status(200).json({ message: `${result.affectedRows} chaves deletadas com sucesso!` });
    } else {
      res.status(200).json({ message: 'Não há chaves vazias para deletar.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar HWID vazio.' });
  }
});

app.post('/api/delete-key', async (req, res) => {
  const { key } = req.body;
  
  if (!key) {
    return res.status(400).json({ error: 'License Key é obrigatória.' });
  }

  try {
    const [result] = await db.query('DELETE FROM license_keys WHERE license_key = ?', [key]);
    
    if (result.affectedRows > 0) {
      res.status(200).json({ message: `License Key '${key}' deletada com sucesso!` });
    } else {
      res.status(404).json({ error: 'License Key não encontrada.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar chave.' });
  }
});

// FILE SYSTEM \\

app.post('/upload', upload.single('file'), async (req, res) => {
  const { user } = req.body;
  if (!user) {
    return res.status(400).json({ error: 'Usuário é obrigatório.' });
  }

  const filePath = path.join('archives', req.file.filename);
  const date = formatDate(new Date());

  const fileData = { file_path: filePath, user, date , file_name: req.file.originalname};

  try {
    const jsonFilePath = path.join(__dirname, 'arquivos.json');
    let arquivos = [];

    if (fs2.existsSync(jsonFilePath)) {
      const data = fs2.readFileSync(jsonFilePath);
      arquivos = JSON.parse(data);
    }

    arquivos.push(fileData);
    fs2.writeFileSync(jsonFilePath, JSON.stringify(arquivos, null, 2));  // Salva os dados no arquivo JSON

    res.status(200).json({ message: 'Arquivo enviado com sucesso.', file: fileData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao salvar o arquivo.' });
  }
});

app.get('/files', (req, res) => {
  const jsonFilePath = path.join(__dirname, 'arquivos.json');
  
  if (fs2.existsSync(jsonFilePath)) {
    const data = fs2.readFileSync(jsonFilePath);
    const arquivos = JSON.parse(data);
    res.status(200).json({ arquivos });
  } else {
    res.status(404).json({ error: 'Nenhum arquivo encontrado.' });
  }
});

app.delete('/files/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, 'archives', filename);

  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('Erro ao deletar arquivo:', err);
        return res.status(500).json({ error: 'Erro ao deletar arquivo.' });
      }

      const jsonFilePath = path.join(__dirname, 'arquivos.json');
      if (fs2.existsSync(jsonFilePath)) {
        let arquivos = JSON.parse(fs2.readFileSync(jsonFilePath));
        arquivos = arquivos.filter(file => path.basename(file.file_path) !== filename);

        fs2.writeFileSync(jsonFilePath, JSON.stringify(arquivos, null, 2));
      }

      return res.status(200).json({ message: 'Arquivo apagado com sucesso.' });
    });
  } else {
    return res.status(404).json({ error: 'Arquivo não encontrado.' });
  }
});

app.get('/files/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, 'archives', filename);
  const jsonFilePath = path.join(__dirname, 'arquivos.json');

  if (!fs2.existsSync(filePath)) {
    return res.status(404).json({ error: 'Arquivo não encontrado.' });
  }

  if (!fs2.existsSync(jsonFilePath)) {
    return res.status(500).json({ error: 'Arquivo de metadados não encontrado.' });
  }

  const arquivos = JSON.parse(fs2.readFileSync(jsonFilePath));
  const entry = arquivos.find(file => path.basename(file.file_path) === filename);

  if (!entry) {
    return res.status(404).json({ error: 'Metadados do arquivo não encontrados.' });
  }
  res.download(filePath, entry.file_name);
});

app.get('/last-file', (req, res) => {
  const jsonFilePath = path.join(__dirname, 'arquivos.json');
  
  if (fs2.existsSync(jsonFilePath)) {
    const data = fs2.readFileSync(jsonFilePath);
    const arquivos = JSON.parse(data);
    
    if (arquivos.length > 0) {
      const lastFile = arquivos[arquivos.length - 1];
      res.status(200).json({ lastFile });
    } else {
      res.status(404).json({ error: 'Nenhum arquivo enviado.' });
    }
  } else {
    res.status(404).json({ error: 'Nenhum arquivo encontrado.' });
  }
});


// Configuração do servidor

app.listen(PORT, () => {
    console.clear();
    console.log(chalk.red(`
        
███╗░░░███╗██╗░░██╗  ░█████╗░██╗░░░██╗████████╗██╗░░██╗
████╗░████║██║░██╔╝  ██╔══██╗██║░░░██║╚══██╔══╝██║░░██║
██╔████╔██║█████═╝░  ███████║██║░░░██║░░░██║░░░███████║
██║╚██╔╝██║██╔═██╗░  ██╔══██║██║░░░██║░░░██║░░░██╔══██║
██║░╚═╝░██║██║░╚██╗  ██║░░██║╚██████╔╝░░░██║░░░██║░░██║
╚═╝░░░░░╚═╝╚═╝░░╚═╝  ╚═╝░░╚═╝░╚═════╝░░░░╚═╝░░░╚═╝░░╚═╝
        
    `));
    console.log(chalk.green('Discord: ') + chalk.red(DISCORD));
    console.log(chalk.green(`Estou rodando na porta: `) + chalk.red(PORT));
});