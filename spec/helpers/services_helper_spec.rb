# frozen_string_literal: true

require 'spec_helper'

RSpec.describe ServicesHelper do
  describe '#integration_form_data' do
    let(:fields) do
      [
        :id,
        :show_active,
        :activated,
        :type,
        :merge_request_events,
        :commit_events,
        :enable_comments,
        :comment_detail,
        :learn_more_path,
        :trigger_events,
        :fields,
        :inherit_from_id,
        :integration_level,
        :editable,
        :cancel_path,
        :can_test,
        :test_path,
        :reset_path
      ]
    end

    let(:jira_fields) do
      [
        :jira_issue_transition_automatic,
        :jira_issue_transition_id
      ]
    end

    subject { helper.integration_form_data(integration) }

    context 'Slack service' do
      let(:integration) { build(:slack_service) }

      it { is_expected.to include(*fields) }
      it { is_expected.not_to include(*jira_fields) }

      specify do
        expect(subject[:reset_path]).to eq(helper.scoped_reset_integration_path(integration))
      end
    end

    context 'Jira service' do
      let(:integration) { build(:jira_service) }

      it { is_expected.to include(*fields, *jira_fields) }
    end
  end

  describe '#scoped_reset_integration_path' do
    let(:integration) { build_stubbed(:jira_service) }
    let(:group) { nil }

    subject { helper.scoped_reset_integration_path(integration, group: group) }

    context 'when no group is present' do
      it 'returns instance-level path' do
        is_expected.to eq(reset_admin_application_settings_integration_path(integration))
      end
    end

    context 'when group is present' do
      let(:group) { build_stubbed(:group) }

      it 'returns group-level path' do
        is_expected.to eq(reset_group_settings_integration_path(group, integration))
      end
    end

    context 'when a new integration is not persisted' do
      let_it_be(:integration) { build(:jira_service) }

      it 'returns an empty string' do
        is_expected.to eq('')
      end
    end
  end
end
