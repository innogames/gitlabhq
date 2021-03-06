# frozen_string_literal: true

# Base class for monitoring services
#
# These services integrate with a deployment solution like Prometheus
# to provide additional features for environments.
class MonitoringService < Integration
  default_value_for :category, 'monitoring'

  def self.supported_events
    %w()
  end

  def can_query?
    raise NotImplementedError
  end

  def query(_, *_)
    raise NotImplementedError
  end
end
