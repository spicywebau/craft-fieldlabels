<?php
namespace spicyweb\fieldlabels;

use yii\base\Event as BaseEvent;

use spicyweb\fieldlabels\models\FieldLabel as FieldLabelModel;

/**
 * Class Event
 *
 * @author Spicy Web <craft@spicyweb.com.au>
 * @author Benjamin Fleming
 * @since 1.0.0
 */
class Event extends BaseEvent
{
    /**
     * @var FieldLabelModel The label associated with this event.
     */
    public $label;

    /**
     * @var bool Whether this is a new label.
     */
    public $isNewLabel;

    /**
     * @var bool Whether to save the label.
     */
    public $performAction = true;
}
