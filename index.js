/*  
  Made By Vynaa
  WhatsApp : wa.me/6282389924037
  Telegram : t.me/VynaaValerie
  Youtube : @VegaTech

  Copy Code?, Recode?, Rename?, Reupload?, Reseller? Taruh Credit Ya :D
*/

// Import Module
import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, downloadContentFromMessage, getContentType } from "@whiskeysockets/baileys"
import pino from "pino"
import chalk from "chalk"
import readline from "readline"
import path from "path"
import { fileURLToPath } from "url"

// Path ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Pairing Mode
const usePairingCode = true

// Fungsi Input Terminal
async function question(prompt) {
  process.stdout.write(prompt)
  const r1 = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise((resolve) => {
    r1.question("", (ans) => {
      r1.close()
      resolve(ans)
    })
  })
}

// Handler Tipe Media
const unwrapMessage = (m) => {
  let msg = m?.message ?? m
  while (msg?.ephemeralMessage || msg?.viewOnceMessage || msg?.viewOnceMessageV2 || msg?.viewOnceMessageV2Extension || msg?.documentWithCaptionMessage) {
    msg =
      msg?.ephemeralMessage?.message ??
      msg?.viewOnceMessage?.message ??
      msg?.viewOnceMessageV2?.message ??
      msg?.viewOnceMessageV2Extension?.message ??
      msg?.documentWithCaptionMessage?.message
  }
  return msg
}

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(
    path.resolve(__dirname, "VynaaSesi")
  )

  const { version, isLatest } = await fetchLatestBaileysVersion()
  console.log(`Vynaa Using WA v${version.join(".")}, isLatest: ${isLatest}`)

  const vynaa = makeWASocket({
    logger: pino({ level: "silent" }),
    printQRInTerminal: !usePairingCode,
    auth: state,
    browser: ["Ubuntu", "Chrome", "20.0.04"],
    version,
    syncFullHistory: false,
    generateHighQualityLinkPreview: true,
  })

  // Download Media Message
  vynaa.downloadMediaMessage = async (input) => {
    try {
      const root = input?.message ? input : { message: input }
      const unwrapped = unwrapMessage(root.message)

      const type = getContentType(unwrapped)
      if (!type) throw new Error('Tidak ada media pada pesan')

      const msgContent = unwrapped[type]
      const mediaKind = type.replace('Message', '') // 'image' | 'video' | 'sticker' | 'audio' | 'document'

      const stream = await downloadContentFromMessage(msgContent, mediaKind)
      let buffer = Buffer.alloc(0)
      for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])

      const mimetype =
        msgContent.mimetype ||
        (mediaKind === 'sticker' ? 'image/webp' : undefined)

      return { buffer, mimetype, type: mediaKind }
    } catch (error) {
      console.error('Error downloading media:', error)
      throw error
    }
  }

  // Handle Pairing
  if (usePairingCode && !vynaa.authState.creds.registered) {
    try {
      const phoneNumber = await question("☘️ Masukan Nomor Yang Diawali Dengan 62 :\n")
      const code = await vynaa.requestPairingCode(phoneNumber.trim())
      console.log(`🎁 Pairing Code : ${code}`)
    } catch (err) {
      console.error("Failed to get pairing code:", err)
    }
  }

  vynaa.ev.on("creds.update", saveCreds)

  vynaa.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update
    
    if (connection === "close") {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401
      console.log(chalk.red("❌ Koneksi Terputus, Mencoba Menyambung Ulang..."))
      
      if (shouldReconnect) {
        setTimeout(() => {
          connectToWhatsApp()
        }, 5000)
      }
    } else if (connection === "open") {
      console.log(chalk.green("✔ Bot Berhasil Terhubung Ke WhatsApp"))
      console.log(chalk.blue("🤖 Vynaa Bot siap menerima pesan!"))
    } else if (connection === "connecting") {
      console.log(chalk.yellow("🔄 Menghubungkan ke WhatsApp..."))
    }
  })

  // Handle messages
  vynaa.ev.on("messages.upsert", async (m) => {
    try {
      const msg = m.messages[0]
      if (!msg.message || msg.key.fromMe) return

      // Import dan jalankan handler
      const { default: handler } = await import('./case.js')
      await handler(vynaa, m)

    } catch (error) {
      // Error disembunyikan dari console
    }
  })

  return vynaa
}

// Jalankan bot
connectToWhatsApp().catch(err => {
  // Error connection disembunyikan
})