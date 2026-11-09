export const sendMessage = async ({token, chatId, text}) => {
  if (!token) {
    return false
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({chat_id: chatId, text})
    })

    return response.ok
  } catch (error) {
    console.error("Could not send the Telegram message", error)
    return false
  }
}
