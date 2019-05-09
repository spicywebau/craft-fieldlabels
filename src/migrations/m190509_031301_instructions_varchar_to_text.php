<?php

namespace spicyweb\fieldlabels\migrations;

use Craft;
use craft\db\Migration;

/**
 * m190509_031301_instructions_varchar_to_text migration.
 *
 * @package spicyweb\fieldlabels\migrations
 * @author Spicy Web <craft@spicyweb.com.au>
 * @since 1.1.0
 */
class m190509_031301_instructions_varchar_to_text extends Migration
{
    /**
     * @inheritdoc
     */
    public function safeUp()
    {
        $this->alterColumn('{{%fieldlabels}}', 'instructions', 'text');
    }

    /**
     * @inheritdoc
     */
    public function safeDown()
    {
        echo "m190509_031301_instructions_varchar_to_text cannot be reverted.\n";
        return false;
    }
}
