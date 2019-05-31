<?php
namespace spicyweb\fieldlabels\migrations;


use Craft;
use craft\db\Migration;
use craft\db\Query;

use spicyweb\fieldlabels\Plugin as FieldLabels;
use spicyweb\fieldlabels\models\FieldLabel as FieldLabelModel;

/**
 * Class Install
 *
 * @package spicyweb\fieldlabels\migrations
 * @author Spicy Web <craft@spicyweb.com.au>
 * @author Benjamin Fleming
 * @since 1.0.0
 */
class Install extends Migration
{
    /**
     * @inheritdoc
     */
    public function safeUp()
    {
        if (!$this->db->tableExists('{{%fieldlabels}}')) {
            // Create the Field Labels table
            $this->createTable('{{%fieldlabels}}', [
                'id' => $this->primaryKey(),
                'fieldId' => $this->integer()->notNull(),
                'fieldLayoutId' => $this->integer()->notNull(),
                'name' => $this->string()->null(),
                'instructions' => $this->text()->null(),
                'hideName' => $this->boolean()->notNull(),
                'hideInstructions' => $this->boolean()->notNull(),
                'dateCreated' => $this->dateTime()->notNull(),
                'dateUpdated' => $this->dateTime()->notNull(),
                'uid' => $this->uid(),
            ]);

            // Create indexes
			$this->createIndex(null, '{{%fieldlabels}}', ['fieldId'], false);
			$this->createIndex(null, '{{%fieldlabels}}', ['fieldLayoutId'], false);

            // Add foreign keys
            $this->addForeignKey(null, '{{%fieldlabels}}', ['fieldId'], '{{%fields}}', ['id'], 'CASCADE', null);
            $this->addForeignKey(null, '{{%fieldlabels}}', ['fieldLayoutId'], '{{%fieldlayouts}}', ['id'], 'CASCADE', null);
        }

        // Check if we need to migrate content from Field Labels' Craft 2 version, the original Relabel
        if ($this->db->tableExists('{{%relabel}}')) {
            $this->_migrate();
        }

        return true;
    }

    /**
     * @inheritdoc
     */
    public function safeDown()
    {
        $this->dropTableIfExists('{{%fieldlabels}}');
    }

    /**
     * Performs the upgrade migration from Field Labels' Craft 2 version, the original Relabel.
     */
    private function _migrate()
    {
        // Check if this is actually the original Relabel...
        $projectConfig = Craft::$app->getProjectConfig();
        $isOriginal = $projectConfig->get('relabel') === null;

        // Update the Craft plugins table
        if ($isOriginal) {
            $row = (new Query)
                ->select(['id', 'handle'])
                ->from(['{{%plugins}}'])
                ->where(['in', 'handle', ['relabel', 'relabel']])
                ->one();

            if ($row) {
                $oldKey = "plugins.{$row['handle']}";
                $newKey = 'plugins.fieldlabels';
                $projectConfig->set($newKey, $projectConfig->get($oldKey));
        
                // Delete the old Relabel plugin row and project config data
                $this->delete('{{%plugins}}', ['id' => $row['id']]);
                $projectConfig->remove($oldKey);
            }
        }

        // Get the old data and move it to the new table
        $oldLabels = (new Query)
            ->select([
                'id',
                'fieldId',
                'fieldLayoutId',
                'name',
                'instructions',
                'uid',
            ])
            ->from('{{%relabel}}')
            ->all();

        foreach ($oldLabels as $oldLabelRow) {
            // Add some new column data
            $newLabelRow = array_merge($oldLabelRow, [
                'hideName' => false,
                'hideInstructions' => false,
            ]);

            // Save
            $newLabel = new FieldLabelModel($newLabelRow);
            FieldLabels::$plugin->methods->saveLabel($newLabel);
        }

        // Drop the old table now
        if ($isOriginal) {
            $this->dropTableIfExists('{{%relabel}}');
        }
    }
}
