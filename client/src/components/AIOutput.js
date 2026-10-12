import React from 'react';
import FormattedAIReport from './FormattedAIReport';

export default function AIOutput({ content, title = 'AI result' }) {
  if (content === null || content === undefined || content === '') return null;
  return <FormattedAIReport response={content} title={title} />;
}
