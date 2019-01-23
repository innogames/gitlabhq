# frozen_string_literal: true

module HashedStorage
  class ProjectRollbackWorker
    include ApplicationWorker

    LEASE_TIMEOUT = 30.seconds.to_i

    queue_namespace :hashed_storage

    # rubocop: disable CodeReuse/ActiveRecord
    def perform(project_id, old_disk_path = nil)
      uuid = lease_for(project_id).try_obtain

      if uuid
        project = Project.without_deleted.find_by(id: project_id)
        return unless project

        old_disk_path ||= project.disk_path

        ::Projects::HashedStorage::RollbackService.new(project, old_disk_path, logger: logger).execute
      else
        return false
      end

    ensure
      cancel_lease_for(project_id, uuid) if uuid
    end

    # rubocop: enable CodeReuse/ActiveRecord

    def lease_for(project_id)
      Gitlab::ExclusiveLease.new(lease_key(project_id), timeout: LEASE_TIMEOUT)
    end

    private

    def lease_key(project_id)
      # we share the same lease key for both migration and rollback so they don't run simultaneously
      "#{ProjectMigrateWorker::LEASE_KEY_SEGMENT}:#{project_id}"
    end

    def cancel_lease_for(project_id, uuid)
      Gitlab::ExclusiveLease.cancel(lease_key(project_id), uuid)
    end
  end
end
