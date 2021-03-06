# frozen_string_literal: true

require 'spec_helper'
require_migration!

RSpec.describe DropProjectCiCdSettingsMergeTrainsEnabled do
  let!(:project_ci_cd_setting) { table(:project_ci_cd_settings) }

  it 'correctly migrates up and down' do
    reversible_migration do |migration|
      migration.before -> {
        expect(project_ci_cd_setting.column_names).to include("merge_trains_enabled")
      }

      migration.after -> {
        project_ci_cd_setting.reset_column_information
        expect(project_ci_cd_setting.column_names).not_to include("merge_trains_enabled")
      }
    end
  end
end
