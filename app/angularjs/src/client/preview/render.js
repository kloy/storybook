import { document } from 'global';
import { stripIndents } from 'common-tags';
import { logger } from '@storybook/client-logger';
import { nopreview } from './nopreview';
import { errorpreview } from './errorpreview';

let previousKind = '';
let previousStory = '';

const rootElement = document.getElementById('root');

export function renderError(error) {
  rootElement.innerHTML = errorpreview(error.message, error.stack);
}

export function renderException(error) {
  renderError(error);
  logger.error(error.stack);
}

export function renderMain(data, storyStore) {
  if (storyStore.size() === 0) return;
  const { selectedKind, selectedStory } = data;
  const story = storyStore.getStory(selectedKind, selectedStory);

  if (selectedKind !== previousKind || previousStory !== selectedStory) {
    previousKind = selectedKind;
    previousStory = selectedStory;
  } else {
    return;
  }
  const context = {
    kind: selectedKind,
    story: selectedStory,
  };
  const component = story ? story(context) : nopreview;

  if (!component) {
    renderError({
      message: `Expecting a AngularJS component from the story: "${selectedStory}" of "${selectedKind}".`,
      stack: stripIndents`
        Did you forget to return the AngularJS component from the story?
        Use "() => '&lt;your-component-name&gt;&lt;/your-component-name\&gt;'" when defining the story.
      `,
    });
    return;
  }

  // TODO make render awesome for AngularJS
  if (typeof component === 'string') {
    rootElement.innerHTML = component;
  } else {
    rootElement.innerHTML = '';
    rootElement.appendChild(component);
  }
}

export default function renderPreview({ reduxStore, storyStore }) {
  const state = reduxStore.getState();
  if (state.error) {
    return renderException(state.error);
  }
  try {
    return renderMain(state, storyStore);
  } catch (ex) {
    return renderException(ex);
  }
}
