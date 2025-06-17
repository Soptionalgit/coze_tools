// 加载环境变量
require('dotenv').config()

const Koa = require('koa')
const Router = require('koa-router')
const bodyParser = require('koa-bodyparser')
const nodemailer = require('nodemailer')

const app = new Koa()
const router = new Router()

// 从环境变量获取邮箱配置
const EMAIL_USER = process.env.EMAIL_USER
const EMAIL_PASS = process.env.EMAIL_PASS

// 验证环境变量是否存在
if (!EMAIL_USER || !EMAIL_PASS) {
  console.error('错误: 邮箱配置未设置。请确保 EMAIL_USER 和 EMAIL_PASS 环境变量已配置。')
  process.exit(1)
}

// 创建一个全局的邮件传输器实例，只连接一次
const transporter = nodemailer.createTransport({
  host: 'smtp.163.com',
  port: 465,
  secure: true, // 使用SSL
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
})

// 使用bodyParser中间件解析请求体
app.use(bodyParser())

// 定义发送邮件的路由
router.post('/send-email', async (ctx) => {
  try {
    const { to, subject, text, html } = ctx.request.body

    // 验证必要参数
    if (!to) {
      ctx.status = 400
      ctx.body = { success: false, message: '收件人地址不能为空' }
      return
    }

    // 邮件选项
    const mailOptions = {
      from: `"邮件发送服务" <${EMAIL_USER}>`, // 使用环境变量中的邮箱
      to: to, // 收件人
      subject: subject || '无主题', // 主题
      text: text || '', // 纯文本内容
      html: html || '' // HTML内容
    }

    // 发送邮件
    const info = await transporter.sendMail(mailOptions)

    ctx.body = {
      success: true,
      messageId: info.messageId,
      message: '邮件发送成功'
    }
  } catch (error) {
    console.error('发送邮件失败:', error)
    ctx.status = 500
    ctx.body = {
      success: false,
      message: '发送邮件失败',
      error: error.message
    }
  }
})

// 健康检查路由
router.get('/health', (ctx) => {
  console.log('health-check')
  ctx.body = { status: 'ok' }
})

// 注册路由
app.use(router.routes()).use(router.allowedMethods())

// 启动服务器
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`邮件服务已启动，监听端口: ${PORT}`)
})
