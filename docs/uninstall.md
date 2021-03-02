# Uninstall Code Ocean

The following article describes the process of tearing down a Code Ocean private cloud deployment.

## Export Data

Before uninstalling Code Ocean please make sure to preserve any required user generated content in the system. *Uninstalling Code Ocean will delete all data in the system.*
To preserve your data, please follow instructions to [export your capsules](https://docs.codeocean.com/onboarding/v/v0.10/faq/faq-general#how-to-export-capsules-and-reproduce-results-on-my-local-machine) [and download your data assets](https://docs.codeocean.com/onboarding/v/v0.10/data-assets-guide/viewing-and-editing-data-assets) (including results) via your Code Ocean application

## Uninstall Steps

1. Unprotect AWS Resources
    
    To prevent users from accidently deleting their own data, Pulumi lets us to flag resources as `protected`. A protected resource cannot be destroyed without first removing the protection flag.
    The following script removes the Pulumi protection flag from Code Ocean persistent storage.
    ```
    pulumi stack export | jq '.deployment.resources[]|select(contains({protect:true})).urn' | xargs -n1 -t pulumi state unprotect -y
    ```

2. Empty S3 Buckets

    During teardown Pulumi needs to empty S3 buckets before deleting them but this is often slow and can lead to a timeout for the entire teardown process. We therefore recommend to empty S3 buckets before initiating a `pulumi destroy`.
    The following script empty the datasets and access-logs buckets.
    ```
    mkdir /tmp/empty
    aws s3 sync --delete "/tmp/empty" s3://`pulumi stack export | jq -r '.deployment.resources[]|select(contains({type:"aws:s3/bucket:Bucket",urn:"access-logs"})).id'`
    aws s3 sync --delete "/tmp/empty" s3://`pulumi stack export | jq -r '.deployment.resources[]|select(contains({type:"aws:s3/bucket:Bucket",urn:"datasets"})).id'`
    ```

3. Purge Backup Vault

    The AWS Backup vault holds your Code Ocean deployment's data volume snapshots.
    The following shell script deletes all vault recovery points:
    ```
    set -e

    VAULT_NAME=`pulumi stack export | jq -r '.deployment.resources[]|select(.type == "aws:backup/vault:Vault").id'`
    
    for ARN in $(aws backup list-recovery-points-by-backup-vault --backup-vault-name "${VAULT_NAME}" --query 'RecoveryPoints[].RecoveryPointArn' --output text); do
      echo "deleting ${ARN} ..."
      aws backup delete-recovery-point --backup-vault-name "${VAULT_NAME}" --recovery-point-arn "${ARN}"
    done
    ```

4. Pulumi Destroy

    Delete all AWS resources:
    ```
    pulumi destroy
    ```
