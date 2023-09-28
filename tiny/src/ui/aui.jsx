import { useState, useEffect } from "preact/hooks"

const colors = {
    error: "#FF0033"
}

export const Button = (props) => {
    const [object, setObject] = useState(null)

    useEffect(() => {
        const defaultObject = {
            type: "button",
            key: "",
            name: "",
            onClick: () => {},
            style: {},
            fullWidth: false,
            disabled: false,
            variant: "contained",
            color: "primary",
            class: "default",
        }

        const newObject = {...defaultObject, ...props}

        newObject.style['width'] = newObject.fullWidth ? '100%' : 'auto'
        newObject.class = newObject.class + " " + newObject.variant + ' ' + newObject.color

        setObject(newObject)
    }, [props])

    
    return (
        <>
            {
                object && 
                <button
                    key={object.key} 
                    type={object.type}
                    name={object.name}
                    onClick={object.onClick}
                    style={object.style}
                    disabled={object.disabled}
                    class={object.class}
                >
                    {object.children}
                </button> 
            }
        </>
    )
}

export const Input = (props) => {
    const [object, setObject] = useState(null)

    useEffect(() => {
        const defaultObject = {
            type: "text",
            placeholder: "",
            key: "",
            name: "",
            value: "",
            onChange: () => {},
            style: {},
            fullWidth: false,
            error: false,
            disabled: false,
            readOnly: false,
            required: false,
            step: 1,
            autoFocus: false,
            label: "",
        }

        const newObject = {...defaultObject, ...props}

        newObject.style['width'] = newObject.fullWidth ? '100%' : 'auto'
        newObject.style['borderColor'] = newObject.error ? colors.error : 'auto'

        setObject(newObject)
    }, [props])

    
    return (
        <>
            {
                object &&
                <div style={object.style}>
                    {
                        object.label &&
                        <label htmlFor={object.name}>{object.label}</label>
                    }
                    {
                        <input
                            // label={label}
                            key={object.key} 
                            type={object.type}
                            placeholder={object.placeholder}
                            name={object.name}
                            value={object.value}
                            onInput={object.onChange}
                            style={object.style}
                            disabled={object.disabled}
                            readOnly={object.readOnly}
                            required={object.required}
                            step={object.step}
                            autoFocus={object.autoFocus}
                        /> 
                    }
                </div>
            }
        </>
    )
}

export const Select = (props) => {
    const [object, setObject] = useState(null)

    useEffect(() => {
        const defaultObject = {
            key: "",
            name: "",
            value: "",
            onChange: () => {},
            style: {},
            fullWidth: false,
            disabled: false,
            readOnly: false,
            required: false,
            autoFocus: false,
            children: []
        }

        const newObject = {...defaultObject, ...props}

        newObject.style['width'] = newObject.fullWidth ? '100%' : 'auto'

        setObject(newObject)
    }, [props])

    
    return (
        <>
            {
                object && 
                <select
                    key={object.key} 
                    name={object.name}
                    value={object.value}
                    onInput={object.onChange}
                    style={object.style}
                    disabled={object.disabled}
                    readOnly={object.readOnly}
                    required={object.required}
                    autoFocus={object.autoFocus}
                >
                    {object.children}
                </select> 
            }
        </>
    )
}

export const TextArea = (props) => {
    const [object, setObject] = useState(null)

    useEffect(() => {
        const defaultObject = {
            key: "",
            name: "",
            value: "",
            placeholder: "",
            onChange: () => {},
            style: {},
            fullWidth: false,
            error: false,
            disabled: false,
            readOnly: false,
            required: false,
            autoFocus: false,
            rows: 4,
            cols: 0,
            resize: false,
        }

        const newObject = {...defaultObject, ...props}

        newObject.style['width'] = newObject.fullWidth ? '100%' : 'auto'
        newObject.style['borderColor'] = newObject.error ? colors.error : 'auto'
        newObject.style['resize'] = newObject.resize ? 'vertical' : 'none'

        setObject(newObject)
    }, [props])

    
    return (
        <>
            {
                object && 
                <textarea
                    key={object.key} 
                    name={object.name}
                    placeholder={object.placeholder}
                    value={object.value}
                    onInput={object.onChange}
                    style={object.style}
                    disabled={object.disabled}
                    readOnly={object.readOnly}
                    required={object.required}
                    autoFocus={object.autoFocus}
                    rows={object.rows}
                    cols={object.cols}
                /> 
            }
        </>
    )
}