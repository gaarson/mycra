import { jest } from '@jest/globals';
import { mySvg } from ".";

describe('create plugin instance', () => {
  const watcherSpy = jest.fn();

  beforeEach(() => {
    watcherSpy.mockClear();
  });

  test('do some', async () => { 
    expect(watcherSpy).toHaveBeenCalledTimes(0);
  });
});

