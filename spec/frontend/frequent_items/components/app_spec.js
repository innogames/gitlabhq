import MockAdapter from 'axios-mock-adapter';
import Vue from 'vue';
import { useRealDate } from 'helpers/fake_date';
import { useLocalStorageSpy } from 'helpers/local_storage_helper';
import { mountComponentWithStore } from 'helpers/vue_mount_component_helper';
import waitForPromises from 'helpers/wait_for_promises';
import appComponent from '~/frequent_items/components/app.vue';
import { FREQUENT_ITEMS, HOUR_IN_MS } from '~/frequent_items/constants';
import eventHub from '~/frequent_items/event_hub';
import { createStore } from '~/frequent_items/store';
import { getTopFrequentItems } from '~/frequent_items/utils';
import axios from '~/lib/utils/axios_utils';
import { currentSession, mockFrequentProjects, mockSearchedProjects } from '../mock_data';

useLocalStorageSpy();

let session;
const createComponentWithStore = (namespace = 'projects') => {
  session = currentSession[namespace];
  gon.api_version = session.apiVersion;
  const Component = Vue.extend(appComponent);
  const store = createStore();

  return mountComponentWithStore(Component, {
    store,
    props: {
      namespace,
      currentUserName: session.username,
      currentItem: session.project || session.group,
    },
  });
};

describe('Frequent Items App Component', () => {
  let vm;
  let mock;

  beforeEach(() => {
    mock = new MockAdapter(axios);
    vm = createComponentWithStore();
  });

  afterEach(() => {
    mock.restore();
    vm.$destroy();
  });

  describe('methods', () => {
    describe('dropdownOpenHandler', () => {
      it('should fetch frequent items when no search has been previously made on desktop', () => {
        jest.spyOn(vm, 'fetchFrequentItems').mockImplementation(() => {});

        vm.dropdownOpenHandler();

        expect(vm.fetchFrequentItems).toHaveBeenCalledWith();
      });
    });

    describe('logItemAccess', () => {
      let storage;

      beforeEach(() => {
        storage = {};

        localStorage.setItem.mockImplementation((storageKey, value) => {
          storage[storageKey] = value;
        });

        localStorage.getItem.mockImplementation((storageKey) => {
          if (storage[storageKey]) {
            return storage[storageKey];
          }

          return null;
        });
      });

      it('should create a project store if it does not exist and adds a project', () => {
        vm.logItemAccess(session.storageKey, session.project);

        const projects = JSON.parse(storage[session.storageKey]);

        expect(projects.length).toBe(1);
        expect(projects[0].frequency).toBe(1);
        expect(projects[0].lastAccessedOn).toBeDefined();
      });

      it('should prevent inserting same report multiple times into store', () => {
        vm.logItemAccess(session.storageKey, session.project);
        vm.logItemAccess(session.storageKey, session.project);

        const projects = JSON.parse(storage[session.storageKey]);

        expect(projects.length).toBe(1);
      });

      describe('with real date', () => {
        useRealDate();

        it('should increase frequency of report if it was logged multiple times over the course of an hour', () => {
          let projects;
          const newTimestamp = Date.now() + HOUR_IN_MS + 1;

          vm.logItemAccess(session.storageKey, session.project);
          projects = JSON.parse(storage[session.storageKey]);

          expect(projects[0].frequency).toBe(1);

          vm.logItemAccess(session.storageKey, {
            ...session.project,
            lastAccessedOn: newTimestamp,
          });
          projects = JSON.parse(storage[session.storageKey]);

          expect(projects[0].frequency).toBe(2);
          expect(projects[0].lastAccessedOn).not.toBe(session.project.lastAccessedOn);
        });
      });

      it('should always update project metadata', () => {
        let projects;
        const oldProject = {
          ...session.project,
        };

        const newProject = {
          ...session.project,
          name: 'New Name',
          avatarUrl: 'new/avatar.png',
          namespace: 'New / Namespace',
          webUrl: 'http://localhost/new/web/url',
        };

        vm.logItemAccess(session.storageKey, oldProject);
        projects = JSON.parse(storage[session.storageKey]);

        expect(projects[0].name).toBe(oldProject.name);
        expect(projects[0].avatarUrl).toBe(oldProject.avatarUrl);
        expect(projects[0].namespace).toBe(oldProject.namespace);
        expect(projects[0].webUrl).toBe(oldProject.webUrl);

        vm.logItemAccess(session.storageKey, newProject);
        projects = JSON.parse(storage[session.storageKey]);

        expect(projects[0].name).toBe(newProject.name);
        expect(projects[0].avatarUrl).toBe(newProject.avatarUrl);
        expect(projects[0].namespace).toBe(newProject.namespace);
        expect(projects[0].webUrl).toBe(newProject.webUrl);
      });

      it('should not add more than 20 projects in store', () => {
        for (let id = 0; id < FREQUENT_ITEMS.MAX_COUNT; id += 1) {
          const project = {
            ...session.project,
            id,
          };
          vm.logItemAccess(session.storageKey, project);
        }

        const projects = JSON.parse(storage[session.storageKey]);

        expect(projects.length).toBe(FREQUENT_ITEMS.MAX_COUNT);
      });
    });
  });

  describe('created', () => {
    it('should bind event listeners on eventHub', (done) => {
      jest.spyOn(eventHub, '$on').mockImplementation(() => {});

      createComponentWithStore().$mount();

      Vue.nextTick(() => {
        expect(eventHub.$on).toHaveBeenCalledWith('projects-dropdownOpen', expect.any(Function));
        done();
      });
    });
  });

  describe('beforeDestroy', () => {
    it('should unbind event listeners on eventHub', (done) => {
      jest.spyOn(eventHub, '$off').mockImplementation(() => {});

      vm.$mount();
      vm.$destroy();

      Vue.nextTick(() => {
        expect(eventHub.$off).toHaveBeenCalledWith('projects-dropdownOpen', expect.any(Function));
        done();
      });
    });
  });

  describe('template', () => {
    it('should render search input', () => {
      expect(vm.$el.querySelector('.search-input-container')).toBeDefined();
    });

    it('should render loading animation', (done) => {
      vm.$store.dispatch('fetchSearchedItems');

      Vue.nextTick(() => {
        const loadingEl = vm.$el.querySelector('.loading-animation');

        expect(loadingEl).toBeDefined();
        expect(loadingEl.classList.contains('prepend-top-20')).toBe(true);
        expect(loadingEl.querySelector('span').getAttribute('aria-label')).toBe('Loading projects');
        done();
      });
    });

    it('should render frequent projects list header', (done) => {
      Vue.nextTick(() => {
        const sectionHeaderEl = vm.$el.querySelector('.section-header');

        expect(sectionHeaderEl).toBeDefined();
        expect(sectionHeaderEl.innerText.trim()).toBe('Frequently visited');
        done();
      });
    });

    it('should render frequent projects list', (done) => {
      const expectedResult = getTopFrequentItems(mockFrequentProjects);
      localStorage.getItem.mockImplementation(() => JSON.stringify(mockFrequentProjects));

      expect(vm.$el.querySelectorAll('.frequent-items-list-container li').length).toBe(1);

      vm.fetchFrequentItems();
      Vue.nextTick(() => {
        expect(vm.$el.querySelectorAll('.frequent-items-list-container li').length).toBe(
          expectedResult.length,
        );
        done();
      });
    });

    it('should render searched projects list', (done) => {
      mock.onGet(/\/api\/v4\/projects.json(.*)$/).replyOnce(200, mockSearchedProjects);

      expect(vm.$el.querySelectorAll('.frequent-items-list-container li').length).toBe(1);

      vm.$store.dispatch('setSearchQuery', 'gitlab');
      vm.$nextTick()
        .then(() => {
          expect(vm.$el.querySelector('.loading-animation')).toBeDefined();
        })
        .then(waitForPromises)
        .then(() => {
          expect(vm.$el.querySelectorAll('.frequent-items-list-container li').length).toBe(
            mockSearchedProjects.data.length,
          );
        })
        .then(done)
        .catch(done.fail);
    });
  });
});
