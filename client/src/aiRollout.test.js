import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import api from './api';
import { features } from './featureConfig';
import FormModal, { featureFormPresets } from './components/FormModal';
import AIOutput from './components/AIOutput';
import AIToolsPage, { buildToolPayload, TOOLS, TOOL_PRESETS } from './pages/AIToolsPage';
import AICenter, { aiFeatures } from './pages/AICenter';
import { workspaceFields, workspacePresets } from './components/AIWorkspace';
import workspaceFeatures from './components/aiWorkspaceFeatures.json';
import Login from './pages/Login';

jest.mock('./api', () => ({ post: jest.fn() }));

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

describe('AI rollout', () => {
  test('all record-form presets fill every required and optional field with valid values', () => {
    Object.values(features).forEach((feature) => {
      const presets = featureFormPresets(feature.fields);
      expect(presets).toHaveLength(3);
      presets.forEach((preset) => {
        expect(Object.keys(preset.values).sort()).toEqual(feature.fields.map((field) => field.name).sort());
        feature.fields.forEach((field) => {
          const value = preset.values[field.name];
          expect(String(value).trim()).not.toBe('');
          if (field.type === 'number') expect(Number.isFinite(Number(value))).toBe(true);
          if (field.type === 'select') expect(field.options).toContain(value);
          if (field.name === 'url') expect(() => new URL(value)).not.toThrow();
        });
        const source = preset.values.source_language;
        const target = preset.values.target_language;
        if (source && target) expect(source).not.toBe(target);
      });
    });
  });

  test('the visible record form exposes three buttons that fill all controls', () => {
    const fields = features['trip-plans'].fields;
    const { container } = render(<FormModal fields={fields} onSubmit={jest.fn()} onClose={jest.fn()} title="New trip" />);
    ['Launch example', 'Operations example', 'Growth example'].forEach((label) => {
      fireEvent.click(screen.getByRole('button', { name: label }));
      const controls = [...container.querySelectorAll('input, textarea, select')];
      expect(controls).toHaveLength(fields.length);
      controls.forEach((control) => expect(control.value.trim()).not.toBe(''));
    });
  });

  test('AI Center exposes three complete prompt presets for every feature', () => {
    const { container } = render(<AICenter showToast={jest.fn()} />);
    const featureButtons = [...container.querySelectorAll('.ai-feature-btn')];
    expect(featureButtons).toHaveLength(aiFeatures.length);
    let assertions = 0;
    featureButtons.forEach((featureButton) => {
      fireEvent.click(featureButton);
      ['Quick brief', 'Team planning', 'Detailed review'].forEach((label) => {
        fireEvent.click(screen.getByRole('button', { name: `Demo AI · ${label}` }));
        expect(container.querySelector('[data-ai-field="prompt"]').value.trim()).not.toBe('');
        assertions += 1;
      });
    });
    expect(assertions).toBe(aiFeatures.length * 3);
  });

  test('all advisory workspaces expose three presets covering all ten fields', () => {
    workspaceFeatures.forEach((feature) => {
      const presets = workspacePresets(feature);
      expect(presets).toHaveLength(3);
      presets.forEach((preset) => {
        expect(Object.keys(preset.values).sort()).toEqual(workspaceFields.map((field) => field.key).sort());
        workspaceFields.forEach((field) => expect(String(preset.values[field.key]).trim()).not.toBe(''));
      });
    });
  });

  test('every AI tool preset fills every editable field and builds the native API contract', () => {
    const { container } = render(<AIToolsPage showToast={jest.fn()} />);
    const featureButtons = [...container.querySelectorAll('.ai-feature-btn')];
    TOOLS.forEach((tool, toolIndex) => {
      fireEvent.click(featureButtons[toolIndex]);
      ['Launch review', 'Operations review', 'Growth review'].forEach((label, index) => {
        fireEvent.click(screen.getByRole('button', { name: `Demo AI · ${label}` }));
        const controls = [...container.querySelectorAll('[data-ai-field]')];
        expect(controls).toHaveLength(tool.fields.length);
        controls.forEach((control) => expect(control.value.trim()).not.toBe(''));
        const payload = buildToolPayload(tool, TOOL_PRESETS[tool.key][index]);
        if (tool.key === 'marketplace-recommendations') expect(Array.isArray(payload.recentViews)).toBe(true);
        if (tool.key === 'seller-match') expect(Array.isArray(payload.availableSellers)).toBe(true);
        if (tool.key === 'pricing-advisor') {
          expect(payload.product).toContain(TOOL_PRESETS[tool.key][index].category);
          expect(payload.competitorPrices.every(Number.isFinite)).toBe(true);
        }
        if (tool.key === 'fraud-detection') expect(Array.isArray(payload.signals)).toBe(true);
      });
    });
  });

  test('returned and saved structured JSON render as labeled sections and a table', () => {
    const response = {
      structured: {
        summary: 'The launch is feasible after review.',
        recommendations: [
          { title: 'Verify inventory', owner: 'Operations', confidence: 0.91 },
          { title: 'Confirm delivery window', owner: 'Logistics', confidence: 0.84 },
        ],
      },
    };
    const { container, rerender } = render(<AIOutput content={response} title="Returned result" />);
    expect(screen.getByRole('heading', { name: 'Returned result' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Summary' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Recommendations' })).toBeInTheDocument();
    expect(container.querySelector('table')).toBeInTheDocument();
    expect(container.querySelector('pre')).not.toBeInTheDocument();

    rerender(<AIOutput content={JSON.stringify(response.structured)} title="Saved result" />);
    expect(screen.getByRole('heading', { name: 'Saved result' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Owner' })).toBeInTheDocument();
    expect(container.querySelector('pre')).not.toBeInTheDocument();
  });

  test('demo login uses the existing demo account without exposing its password', async () => {
    api.post.mockResolvedValue({ data: { token: 'controlled-demo-token', user: { id: 1, email: 'admin@aimarket.com' } } });
    const showToast = jest.fn();
    const onLogin = jest.fn();
    render(<Login onLogin={onLogin} showToast={showToast} />);
    fireEvent.click(screen.getByRole('button', { name: 'Log in as Demo' }));
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/auth/demo');
      expect(onLogin).toHaveBeenCalledWith('controlled-demo-token');
      expect(showToast).toHaveBeenCalledWith('Signed in with the existing demo account.', 'success');
    });
  });
});
