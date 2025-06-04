import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../test/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../card';

describe('Card コンポーネント', () => {
  it('基本的なCardが正しくレンダリングされる', () => {
    render(
      <Card data-testid="test-card">
        <CardContent>テストコンテンツ</CardContent>
      </Card>
    );

    const card = screen.getByTestId('test-card');
    expect(card).toBeInTheDocument();
    expect(card).toHaveTextContent('テストコンテンツ');
  });

  it('完全なCard構造が正しくレンダリングされる', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>テストタイトル</CardTitle>
          <CardDescription>テスト説明</CardDescription>
        </CardHeader>
        <CardContent>
          <p>カードの内容</p>
        </CardContent>
        <CardFooter>
          <button>アクション</button>
        </CardFooter>
      </Card>
    );

    expect(screen.getByText('テストタイトル')).toBeInTheDocument();
    expect(screen.getByText('テスト説明')).toBeInTheDocument();
    expect(screen.getByText('カードの内容')).toBeInTheDocument();
    expect(screen.getByText('アクション')).toBeInTheDocument();
  });

  it('className propが正しく適用される', () => {
    render(
      <Card className="custom-class" data-testid="custom-card">
        <CardContent>コンテンツ</CardContent>
      </Card>
    );

    const card = screen.getByTestId('custom-card');
    expect(card).toHaveClass('custom-class');
  });

  it('子要素なしでもエラーにならない', () => {
    render(<Card data-testid="empty-card" />);
    
    const card = screen.getByTestId('empty-card');
    expect(card).toBeInTheDocument();
  });
});