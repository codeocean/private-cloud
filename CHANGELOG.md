CHANGELOG
=========

## 0.6.0 (2020-09-06)

- Mandatory tags are now required when creating datasets and capturing results
- It is now possible to capture results from the Code Ocean IDE in addition to
capturing from Cloud Workstation
- Importing a dataset from S3 or Google Cloud Bucket doesn't require the UI to be kept open
- Allow site admin to generate password reset links for users
- Add support for scaling in workers to 0 when idle
- Add automated daily EBS data volume backups
- Various bug fixes and performance improvements

## 0.5.2 (2020-08-09)

- Bug fix in data reported to analytics pipeline

## 0.5.1 (2020-07-30)

- Update capsule sample code

## 0.5.0 (2020-07-28)

- External Git
- Capsule interface
- Capsule cache
- Allow to restrict access to specific ingress CIDR blocks
- Add support for specifying VPC CIDR block
- Migrate to Pulumi 2
- Improved CloudWatch alerting on data volume disk utilization
- CloudWatch dashboard for data EBS volume metrics

## 0.4.2 (2020-07-20)

- Change cloudWatch alarms

## 0.4.1 (2020-06-30)

- Bug fixes

## 0.4.0 (2020-06-24)

- Asset Management: dynamic mount of datasets
- Asset Management: capture results from inside cloud workstation
- Centralized logging with CloudWatch Logs
- Use EC2 launch template for workers auto scaling group

## 0.3.0 (2020-06-10)

- Asset Management: support for datasets
- Capsule publishing
- CloudWatch alarms for monitoring
- Add X-Small compute resource class
- Improved workers scale out policies to avoid excess machines
- Support for analytics reporting via Segment
- Consistent resource tagging
- Linting with ESLint

## 0.2.1 (2020-04-05)

- Enable Advanced Compute Resources selection

## 0.2.0 (2020-03-15)

- Add support for cloud workstation idle timeout
- Add 2xsmall resource class

## 0.1.0 (2020-03-01)

Initial version
