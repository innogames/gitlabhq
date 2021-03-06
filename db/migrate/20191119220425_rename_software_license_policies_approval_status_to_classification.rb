# frozen_string_literal: true

class RenameSoftwareLicensePoliciesApprovalStatusToClassification < ActiveRecord::Migration[5.2]
  include Gitlab::Database::MigrationHelpers

  DOWNTIME = false

  disable_ddl_transaction!

  def up
    rename_column_concurrently :software_license_policies, :approval_status, :classification
  end

  def down
    undo_rename_column_concurrently :software_license_policies, :approval_status, :classification
  end
end
