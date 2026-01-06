import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
// Импортируем компонент. Кстати, лучше переименовать файл теста в Component.test.tsx,
// раз мы тестируем именно его, но пока оставим как есть.
import { Component } from './Component';

describe('Component behavior', () => {
  it('renders correctly and handles hover states', () => {
    // 1. Render: Рендерим компонент в JSDOM
    const { asFragment } = render(<Component />);

    // Проверяем, что компонент вообще отрисовался.
    // У твоего <article> есть неявная role="article". Это лучший способ поиска (a11y).
    const articleElement = screen.getByRole('article');
    
    // Ищем текст внутри, чтобы убедиться, что дети (children) на месте
    expect(screen.getByText(/po/i)).toBeInTheDocument();
    expect(screen.getByText(/pik/i)).toBeInTheDocument();

    // 2. Initial State Assertion: Проверяем начальный класс
    // В Component.tsx у тебя const [status, setStatus] = useState('normal');
    expect(articleElement).toHaveClass('normal');
    expect(articleElement).not.toHaveClass('hovered');

    // Снимаем snapshot начального состояния (опционально, но полезно для CSS структуры)
    expect(asFragment()).toMatchSnapshot();

    // 3. Interaction: Наводим мышку (MouseEnter)
    fireEvent.mouseEnter(articleElement);

    // 4. Update Assertion: Проверяем, что класс изменился на 'hovered'
    expect(articleElement).toHaveClass('hovered');
    expect(articleElement).not.toHaveClass('normal');

    // 5. Interaction: Убираем мышку (MouseLeave)
    fireEvent.mouseLeave(articleElement);

    // 6. Final Assertion: Проверяем, что класс вернулся в 'normal'
    expect(articleElement).toHaveClass('normal');
  });
});
