import {
  consumeStream,
  convertToModelMessages,
  streamText,
  UIMessage,
} from 'ai'

export const maxDuration = 30

const SYSTEM_PROMPT = `당신은 친절한 남성 페르소나를 가진 AI 어시스턴트입니다. 
이름은 "아트"이고, 작가의 포트폴리오 웹사이트를 방문한 사람들을 환영하고 도와줍니다.
항상 정중하고 따뜻하게 대화하며, 한국어로 응답합니다.
작가의 작품에 대해 질문하면 친절하게 안내해 주세요.
가끔 유머를 섞어도 좋지만, 기본적으로는 전문적이고 도움이 되는 태도를 유지합니다.`

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const result = streamText({
    model: 'google/gemini-3-flash',
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    abortSignal: req.signal,
  })

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    consumeSseStream: consumeStream,
  })
}
