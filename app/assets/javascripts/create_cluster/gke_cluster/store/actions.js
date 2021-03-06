import gapiLoader from '../gapi_loader';
import * as types from './mutation_types';

const gapiResourceListRequest = ({ resource, params, commit, mutation, payloadKey }) =>
  new Promise((resolve, reject) => {
    const request = resource.list(params);

    return request.then(
      (resp) => {
        const { result } = resp;

        commit(mutation, result[payloadKey]);

        resolve();
      },
      (resp) => {
        reject(resp);
      },
    );
  });

export const setProject = ({ commit }, selectedProject) => {
  commit(types.SET_PROJECT, selectedProject);
};

export const setZone = ({ commit }, selectedZone) => {
  commit(types.SET_ZONE, selectedZone);
};

export const setMachineType = ({ commit }, selectedMachineType) => {
  commit(types.SET_MACHINE_TYPE, selectedMachineType);
};

export const setIsValidatingProjectBilling = ({ commit }, isValidatingProjectBilling) => {
  commit(types.SET_IS_VALIDATING_PROJECT_BILLING, isValidatingProjectBilling);
};

export const fetchProjects = ({ commit }) =>
  gapiLoader().then((gapi) =>
    gapiResourceListRequest({
      resource: gapi.client.cloudresourcemanager.projects,
      params: {},
      commit,
      mutation: types.SET_PROJECTS,
      payloadKey: 'projects',
    }),
  );

export const validateProjectBilling = ({ dispatch, commit, state }) =>
  gapiLoader()
    .then((gapi) => {
      const request = gapi.client.cloudbilling.projects.getBillingInfo({
        name: `projects/${state.selectedProject.projectId}`,
      });

      commit(types.SET_ZONE, '');
      commit(types.SET_MACHINE_TYPE, '');

      return request;
    })
    .then(
      (resp) => {
        const { billingEnabled } = resp.result;

        commit(types.SET_PROJECT_BILLING_STATUS, Boolean(billingEnabled));
        dispatch('setIsValidatingProjectBilling', false);
      },
      (errorResp) => {
        dispatch('setIsValidatingProjectBilling', false);
        return errorResp;
      },
    );

export const fetchZones = ({ commit, state }) =>
  gapiLoader().then((gapi) =>
    gapiResourceListRequest({
      resource: gapi.client.compute.zones,
      params: {
        project: state.selectedProject.projectId,
      },
      commit,
      mutation: types.SET_ZONES,
      payloadKey: 'items',
    }),
  );

export const fetchMachineTypes = ({ commit, state }) =>
  gapiLoader().then((gapi) =>
    gapiResourceListRequest({
      resource: gapi.client.compute.machineTypes,
      params: {
        project: state.selectedProject.projectId,
        zone: state.selectedZone,
      },
      commit,
      mutation: types.SET_MACHINE_TYPES,
      payloadKey: 'items',
    }),
  );
