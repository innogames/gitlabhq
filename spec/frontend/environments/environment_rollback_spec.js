import { GlButton } from '@gitlab/ui';
import { shallowMount, mount } from '@vue/test-utils';
import RollbackComponent from '~/environments/components/environment_rollback.vue';
import eventHub from '~/environments/event_hub';

describe('Rollback Component', () => {
  const retryUrl = 'https://gitlab.com/retry';

  it('Should render Re-deploy label when isLastDeployment is true', () => {
    const wrapper = mount(RollbackComponent, {
      propsData: {
        retryUrl,
        isLastDeployment: true,
        environment: {},
      },
    });

    expect(wrapper.element).toHaveSpriteIcon('repeat');
  });

  it('Should render Rollback label when isLastDeployment is false', () => {
    const wrapper = mount(RollbackComponent, {
      propsData: {
        retryUrl,
        isLastDeployment: false,
        environment: {},
      },
    });

    expect(wrapper.element).toHaveSpriteIcon('redo');
  });

  it('should emit a "rollback" event on button click', () => {
    const eventHubSpy = jest.spyOn(eventHub, '$emit');
    const wrapper = shallowMount(RollbackComponent, {
      propsData: {
        retryUrl,
        environment: {
          name: 'test',
        },
      },
    });
    const button = wrapper.find(GlButton);

    button.vm.$emit('click');

    expect(eventHubSpy).toHaveBeenCalledWith('requestRollbackEnvironment', {
      retryUrl,
      isLastDeployment: true,
      name: 'test',
    });
  });
});
