import { afterEach, describe, expect, it, mock } from 'bun:test'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { AiChatPanel } from '@/features/ai-chat/ai-chat-panel'
import type { AiModel, AiProvider } from '@/entities/ai/types'
import { AI_LABEL } from '@/shared/constant/ai'

afterEach(cleanup)

const providers: AiProvider[] = [{ provider: 'codex', status: 'active', displayName: 'Codex' }]
const models: AiModel[] = [
    { modelId: 'gpt-5.6-sol', displayName: 'GPT-5.6 Sol' },
    { modelId: 'gpt-5.6-terra', displayName: 'GPT-5.6 Terra' },
]

const buildProps = (over: Partial<Parameters<typeof AiChatPanel>[0]> = {}) => ({
    width: 360,
    onResize: mock(),
    providers,
    selectedProvider: 'codex',
    onSelectProvider: mock(),
    models,
    selectedModelId: 'gpt-5.6-sol',
    onSelectModel: mock(),
    canRefreshModels: true,
    isRefreshingModels: false,
    onRefreshModels: mock(),
    messages: [],
    isStreaming: false,
    onSend: mock(),
    onCancel: mock(),
    onClose: mock(),
    ...over,
})

describe('AiChatPanel 모델 새로고침', () => {
    it('모델 목록이 있어도 새로고침 버튼이 노출되고 클릭 시 onRefreshModels 를 호출한다', () => {
        const onRefreshModels = mock()
        const { getByLabelText } = render(<AiChatPanel {...buildProps({ onRefreshModels })} />)

        fireEvent.click(getByLabelText(AI_LABEL.refreshModels))

        expect(onRefreshModels).toHaveBeenCalledTimes(1)
    })

    it('모델 목록이 비면 라벨 버튼을 노출하고 클릭 시 onRefreshModels 를 호출한다', () => {
        const onRefreshModels = mock()
        const { getByText } = render(<AiChatPanel {...buildProps({ models: [], selectedModelId: '', onRefreshModels })} />)

        fireEvent.click(getByText(AI_LABEL.refreshModels))

        expect(onRefreshModels).toHaveBeenCalledTimes(1)
    })

    it('갱신 중에는 새로고침 버튼이 비활성화된다', () => {
        const { getByLabelText } = render(<AiChatPanel {...buildProps({ isRefreshingModels: true })} />)

        expect((getByLabelText(AI_LABEL.refreshModels) as HTMLButtonElement).disabled).toBe(true)
    })
})
