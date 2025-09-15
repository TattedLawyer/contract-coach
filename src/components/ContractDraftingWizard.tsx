import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, ArrowLeft, FileText, CheckCircle, Lightbulb, AlertCircle } from "lucide-react";

interface ContractType {
    id: string;
    name: string;
    description: string;
    icon: string;
    questions: ContractQuestion[];
    templateFields: string[];
    biasSides: { [key: string]: string }; // e.g., { 'service-provider': 'Service Provider', 'client': 'Client' }
}

interface ContractQuestion {
    id: string;
    question: string;
    type: 'text' | 'textarea' | 'select' | 'number' | 'boolean' | 'multiselect';
    required: boolean;
    options?: string[];
    placeholder?: string;
    help?: string;
    dependsOn?: string; // ID of another question this depends on
    condition?: any; // Value that triggers this question
}

interface DraftingData {
    [key: string]: any;
}

interface ContractDraftingWizardProps {
    onComplete: (contractText: string) => void;
    onBack: () => void;
    isEnterpriseUser?: boolean; // For bias feature gating
}

const CONTRACT_TYPES: ContractType[] = [
    {
        id: 'service-agreement',
        name: 'Service Agreement',
        description: 'General agreement for providing services, work, or deliverables',
        icon: '🔧',
        templateFields: ['serviceProvider', 'clientName', 'services', 'paymentTerms', 'timeline', 'termination', 'liability', 'ipRights'],
        biasSides: { 'service-provider': 'Service Provider', 'client': 'Client' },
        questions: [
            {
                id: 'serviceProvider',
                question: 'Service provider/company name:',
                type: 'text',
                required: true,
                placeholder: 'e.g., ABC Services LLC'
            },
            {
                id: 'clientName',
                question: 'Client/company name:',
                type: 'text',
                required: true,
                placeholder: 'e.g., XYZ Corporation'
            },
            {
                id: 'services',
                question: 'Services to be provided:',
                type: 'textarea',
                required: true,
                placeholder: 'Describe the services, deliverables, and scope of work...'
            },
            {
                id: 'paymentStructure',
                question: 'Payment structure:',
                type: 'select',
                required: true,
                options: ['Fixed price', 'Hourly rate', 'Monthly retainer', 'Commission-based', 'Milestone payments', 'Other'],
                placeholder: 'Select payment type'
            },
            {
                id: 'paymentAmount',
                question: 'Payment amount/frequency:',
                type: 'text',
                required: true,
                placeholder: 'e.g., $5,000 one-time, $50/hour, $2,000/month'
            },
            {
                id: 'timeline',
                question: 'Project timeline or duration:',
                type: 'text',
                required: false,
                placeholder: 'e.g., 3 months, ongoing, completed by June 30th'
            },
            {
                id: 'termination',
                question: 'Termination conditions:',
                type: 'textarea',
                required: false,
                placeholder: 'e.g., Either party may terminate with 30 days notice'
            }
        ]
    },
    {
        id: 'independent-contractor',
        name: 'Independent Contractor Agreement',
        description: 'Agreement for hiring independent contractors or freelancers',
        icon: '👷',
        templateFields: ['companyName', 'contractorName', 'services', 'compensation', 'term', 'confidentiality', 'ipRights', 'termination'],
        biasSides: { 'company': 'Company (Hiring)', 'contractor': 'Contractor (Hired)' },
        questions: [
            {
                id: 'companyName',
                question: 'Company/Organization name:',
                type: 'text',
                required: true,
                placeholder: 'e.g., Tech Startup Inc.'
            },
            {
                id: 'contractorName',
                question: 'Contractor name:',
                type: 'text',
                required: true,
                placeholder: 'e.g., Jane Freelancer'
            },
            {
                id: 'contractorType',
                question: 'Contractor classification:',
                type: 'select',
                required: false,
                options: ['1099 Independent Contractor', 'W-2 Employee', 'LLC/Entity', 'Other'],
                placeholder: 'Select classification'
            },
            {
                id: 'services',
                question: 'Services or work to be performed:',
                type: 'textarea',
                required: true,
                placeholder: 'Describe the work, responsibilities, and deliverables...'
            },
            {
                id: 'compensation',
                question: 'Compensation details:',
                type: 'textarea',
                required: true,
                placeholder: 'Rate, payment schedule, expenses, etc.'
            },
            {
                id: 'term',
                question: 'Contract term/duration:',
                type: 'text',
                required: false,
                placeholder: 'e.g., 6 months, ongoing, project completion'
            },
            {
                id: 'confidentiality',
                question: 'Confidentiality requirements:',
                type: 'boolean',
                required: false,
                help: 'Include non-disclosure and confidentiality provisions'
            },
            {
                id: 'ipRights',
                question: 'Intellectual property rights:',
                type: 'select',
                required: false,
                options: ['Work for hire - client owns all rights', 'Contractor retains rights, grants license', 'Shared ownership', 'Other'],
                placeholder: 'Select IP arrangement'
            }
        ]
    },
    {
        id: 'consulting-agreement',
        name: 'Consulting Agreement',
        description: 'Agreement for professional consulting services and advice',
        icon: '💡',
        templateFields: ['consultantName', 'clientName', 'consultingServices', 'fees', 'term', 'confidentiality', 'reports', 'termination'],
        biasSides: { 'consultant': 'Consultant', 'client': 'Client' },
        questions: [
            {
                id: 'consultantName',
                question: 'Consultant name:',
                type: 'text',
                required: true,
                placeholder: 'e.g., Dr. Jane Smith Consulting LLC'
            },
            {
                id: 'clientName',
                question: 'Client name:',
                type: 'text',
                required: true,
                placeholder: 'e.g., ABC Corporation'
            },
            {
                id: 'consultingArea',
                question: 'Area of consulting expertise:',
                type: 'text',
                required: true,
                placeholder: 'e.g., Business Strategy, IT, Legal, Marketing'
            },
            {
                id: 'consultingServices',
                question: 'Specific consulting services:',
                type: 'textarea',
                required: true,
                placeholder: 'Describe the consulting work, deliverables, and objectives...'
            },
            {
                id: 'fees',
                question: 'Consulting fees and payment terms:',
                type: 'textarea',
                required: true,
                placeholder: 'Hourly rate, daily rate, project fee, payment schedule...'
            },
            {
                id: 'deliverables',
                question: 'Expected deliverables or reports:',
                type: 'textarea',
                required: false,
                placeholder: 'Presentations, reports, recommendations, etc.'
            },
            {
                id: 'term',
                question: 'Consulting term:',
                type: 'text',
                required: false,
                placeholder: 'e.g., 6 months, project completion, ongoing'
            },
            {
                id: 'confidentiality',
                question: 'Confidentiality requirements:',
                type: 'boolean',
                required: false,
                help: 'Protect sensitive client information'
            }
        ]
    },
    {
        id: 'employment-agreement',
        name: 'Employment Agreement',
        description: 'Agreement for hiring employees with terms and conditions',
        icon: '👔',
        templateFields: ['employerName', 'employeeName', 'position', 'salary', 'benefits', 'duties', 'termination', 'confidentiality'],
        biasSides: { 'employer': 'Employer', 'employee': 'Employee' },
        questions: [
            {
                id: 'employerName',
                question: 'Employer name:',
                type: 'text',
                required: true,
                placeholder: 'e.g., Tech Company Inc.'
            },
            {
                id: 'employeeName',
                question: 'Employee name:',
                type: 'text',
                required: true,
                placeholder: 'e.g., John Doe'
            },
            {
                id: 'position',
                question: 'Job position/title:',
                type: 'text',
                required: true,
                placeholder: 'e.g., Software Developer'
            },
            {
                id: 'employmentType',
                question: 'Employment type:',
                type: 'select',
                required: true,
                options: ['Full-time', 'Part-time', 'Temporary', 'Contract', 'Internship'],
                placeholder: 'Select employment type'
            },
            {
                id: 'salary',
                question: 'Salary/compensation:',
                type: 'text',
                required: true,
                placeholder: 'e.g., $75,000/year, $30/hour'
            },
            {
                id: 'benefits',
                question: 'Benefits and perks:',
                type: 'textarea',
                required: false,
                placeholder: 'Health insurance, PTO, retirement, etc.'
            },
            {
                id: 'duties',
                question: 'Job duties and responsibilities:',
                type: 'textarea',
                required: true,
                placeholder: 'Describe the main job responsibilities...'
            },
            {
                id: 'workLocation',
                question: 'Work location/arrangement:',
                type: 'select',
                required: false,
                options: ['Office-based', 'Remote', 'Hybrid', 'Flexible'],
                placeholder: 'Select work arrangement'
            },
            {
                id: 'startDate',
                question: 'Start date:',
                type: 'text',
                required: true,
                placeholder: 'e.g., March 1, 2024'
            },
            {
                id: 'termination',
                question: 'Termination conditions:',
                type: 'textarea',
                required: false,
                placeholder: 'Notice periods, severance, etc.'
            }
        ]
    },
    {
        id: 'partnership-agreement',
        name: 'Partnership Agreement',
        description: 'Agreement for business partnerships, joint ventures, or collaborations',
        icon: '🤝',
        templateFields: ['parties', 'businessPurpose', 'contributions', 'profitSharing', 'management', 'decisionMaking', 'termination', 'disputeResolution'],
        biasSides: { 'party-a': 'Party A', 'party-b': 'Party B' },
        questions: [
            {
                id: 'parties',
                question: 'Parties involved:',
                type: 'textarea',
                required: true,
                placeholder: 'List all partners/companies and their roles...'
            },
            {
                id: 'businessPurpose',
                question: 'Business purpose/objective:',
                type: 'textarea',
                required: true,
                placeholder: 'Describe the partnership goals and activities...'
            },
            {
                id: 'partnershipType',
                question: 'Type of partnership:',
                type: 'select',
                required: false,
                options: ['General Partnership', 'Limited Partnership', 'LLP', 'Joint Venture', 'Strategic Alliance', 'Other'],
                placeholder: 'Select partnership type'
            },
            {
                id: 'contributions',
                question: 'Partner contributions:',
                type: 'textarea',
                required: true,
                placeholder: 'Capital, assets, services, expertise each partner brings...'
            },
            {
                id: 'ownership',
                question: 'Ownership/profit sharing:',
                type: 'text',
                required: true,
                placeholder: 'e.g., 50/50 split, based on capital contribution'
            },
            {
                id: 'management',
                question: 'Management structure:',
                type: 'textarea',
                required: false,
                placeholder: 'Who makes decisions, committees, voting rights...'
            },
            {
                id: 'decisionMaking',
                question: 'Decision making process:',
                type: 'textarea',
                required: false,
                placeholder: 'Major decisions require unanimous consent, majority vote, etc.'
            },
            {
                id: 'term',
                question: 'Partnership term:',
                type: 'text',
                required: false,
                placeholder: 'e.g., 5 years, perpetual, until dissolved'
            },
            {
                id: 'termination',
                question: 'Termination/dissolution conditions:',
                type: 'textarea',
                required: false,
                placeholder: 'How and when the partnership can end...'
            }
        ]
    },
    {
        id: 'license-agreement',
        name: 'License Agreement',
        description: 'Agreement for licensing intellectual property, software, or content',
        icon: '📄',
        templateFields: ['licensor', 'licensee', 'licensedMaterial', 'licenseScope', 'fees', 'term', 'restrictions', 'termination'],
        biasSides: { 'licensor': 'Licensor (Rights Holder)', 'licensee': 'Licensee (User)' },
        questions: [
            {
                id: 'licensor',
                question: 'Licensor (rights holder) name:',
                type: 'text',
                required: true,
                placeholder: 'e.g., Software Company Inc.'
            },
            {
                id: 'licensee',
                question: 'Licensee (user) name:',
                type: 'text',
                required: true,
                placeholder: 'e.g., Client Corporation'
            },
            {
                id: 'licensedMaterial',
                question: 'Material being licensed:',
                type: 'textarea',
                required: true,
                placeholder: 'Software, content, IP, trademarks, etc.'
            },
            {
                id: 'licenseType',
                question: 'Type of license:',
                type: 'select',
                required: true,
                options: ['Exclusive', 'Non-exclusive', 'Sole', 'Perpetual', 'Limited-term', 'Other'],
                placeholder: 'Select license type'
            },
            {
                id: 'licenseScope',
                question: 'License scope and usage rights:',
                type: 'textarea',
                required: true,
                placeholder: 'What can the licensee do with the material?'
            },
            {
                id: 'territory',
                question: 'Geographic territory:',
                type: 'text',
                required: false,
                placeholder: 'e.g., Worldwide, North America, specific countries'
            },
            {
                id: 'fees',
                question: 'License fees and payment terms:',
                type: 'textarea',
                required: false,
                placeholder: 'One-time fee, royalties, ongoing payments...'
            },
            {
                id: 'term',
                question: 'License term/duration:',
                type: 'text',
                required: true,
                placeholder: 'e.g., 1 year, 5 years, perpetual'
            },
            {
                id: 'restrictions',
                question: 'Usage restrictions or limitations:',
                type: 'textarea',
                required: false,
                placeholder: 'Prohibited uses, modifications, etc.'
            }
        ]
    },
    {
        id: 'nda-confidentiality',
        name: 'NDA/Confidentiality Agreement',
        description: 'Non-disclosure agreement to protect confidential information',
        icon: '🔒',
        templateFields: ['disclosingParty', 'receivingParty', 'confidentialInfo', 'purpose', 'term', 'obligations', 'exclusions', 'remedies'],
        biasSides: { 'disclosing': 'Disclosing Party', 'receiving': 'Receiving Party' },
        questions: [
            {
                id: 'disclosingParty',
                question: 'Disclosing party name:',
                type: 'text',
                required: true,
                placeholder: 'e.g., ABC Corporation (sharing confidential info)'
            },
            {
                id: 'receivingParty',
                question: 'Receiving party name:',
                type: 'text',
                required: true,
                placeholder: 'e.g., XYZ Contractor (receiving confidential info)'
            },
            {
                id: 'purpose',
                question: 'Purpose of sharing information:',
                type: 'textarea',
                required: true,
                placeholder: 'Business discussions, potential partnership, project work...'
            },
            {
                id: 'confidentialInfo',
                question: 'Type of confidential information:',
                type: 'textarea',
                required: true,
                placeholder: 'Trade secrets, business plans, customer data, technical specs...'
            },
            {
                id: 'term',
                question: 'Confidentiality term/duration:',
                type: 'text',
                required: true,
                placeholder: 'e.g., 2 years, 5 years, indefinite'
            },
            {
                id: 'obligations',
                question: 'Specific confidentiality obligations:',
                type: 'textarea',
                required: false,
                placeholder: 'How to protect information, who can access it...'
            },
            {
                id: 'exclusions',
                question: 'Information exclusions (what\'s not confidential):',
                type: 'textarea',
                required: false,
                placeholder: 'Publicly known info, independently developed, etc.'
            },
            {
                id: 'returnDestruction',
                question: 'Return/destruction requirements:',
                type: 'boolean',
                required: false,
                help: 'Require return or destruction of confidential materials'
            }
        ]
    }
];

export const ContractDraftingWizard: React.FC<ContractDraftingWizardProps> = ({
    onComplete,
    onBack,
    isEnterpriseUser = false
}) => {
    const [step, setStep] = useState<'select-type' | 'select-bias' | 'gather-info' | 'review-generate'>('select-type');
    const [selectedContractType, setSelectedContractType] = useState<ContractType | null>(null);
    const [selectedBias, setSelectedBias] = useState<string | null>(null);
    const [draftingData, setDraftingData] = useState<DraftingData>({});
    const [isGenerating, setIsGenerating] = useState(false);
    const [customDescription, setCustomDescription] = useState('');
    const { toast } = useToast();

    const handleContractTypeSelect = (contractType: ContractType) => {
        setSelectedContractType(contractType);
        if (isEnterpriseUser && contractType.biasSides) {
            setStep('select-bias');
        } else {
            setStep('gather-info');
        }
    };

    const handleBiasSelect = (biasSide: string) => {
        setSelectedBias(biasSide);
        setStep('gather-info');
    };

    const handleCustomDescription = () => {
        if (!customDescription.trim()) {
            toast({
                title: "Missing Description",
                description: "Please describe the contract you want to draft.",
                variant: "destructive",
            });
            return;
        }

        // For custom descriptions, we'll use a generic template and let AI handle it
        const customType: ContractType = {
            id: 'custom',
            name: 'Custom Contract',
            description: 'Custom contract based on your description',
            icon: '📝',
            templateFields: [],
            biasSides: {},
            questions: [
                {
                    id: 'fullDescription',
                    question: 'Please provide detailed requirements for your contract:',
                    type: 'textarea',
                    required: true,
                    placeholder: 'Describe parties involved, payment terms, responsibilities, duration, etc.'
                }
            ]
        };

        setSelectedContractType(customType);
        setDraftingData({ fullDescription: customDescription });
        setStep('review-generate');
    };

    const handleAnswerChange = (questionId: string, value: any) => {
        setDraftingData(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    const getVisibleQuestions = () => {
        if (!selectedContractType) return [];

        return selectedContractType.questions.filter(question => {
            if (!question.dependsOn) return true;

            const dependencyValue = draftingData[question.dependsOn];
            return dependencyValue === question.condition;
        });
    };

    const canProceedToReview = () => {
        if (!selectedContractType) return false;

        const visibleQuestions = getVisibleQuestions();
        return visibleQuestions.every(q => !q.required || (draftingData[q.id] !== undefined && draftingData[q.id] !== ''));
    };

    const handleGenerate = async () => {
        if (!selectedContractType) return;

        setIsGenerating(true);
        try {
            // Prepare the prompt for AI generation
            let prompt = `Please draft a comprehensive ${selectedContractType.name} with the following details:\n\n`;

            if (selectedContractType.id === 'custom') {
                prompt += draftingData.fullDescription;
            } else {
                // Format structured data for known contract types
                const visibleQuestions = getVisibleQuestions();
                visibleQuestions.forEach(question => {
                    const answer = draftingData[question.id];
                    if (answer !== undefined && answer !== '') {
                        prompt += `${question.question}\n${answer}\n\n`;
                    }
                });

                // Add contract type specific requirements
                prompt += `\nPlease ensure the contract includes standard clauses for a ${selectedContractType.name.toLowerCase()}, including:`;
                if (selectedContractType.id.includes('internship')) {
                    prompt += `\n- Month-to-month structure\n- No employment relationship\n- IP ownership and confidentiality\n- At-will termination\n- ${draftingData.conversionOption ? 'Option to convert to paid contractor' : 'No conversion option'}`;
                } else if (selectedContractType.id.includes('contractor')) {
                    prompt += `\n- Contractor status (not employee)\n- IP ownership and confidentiality\n- Termination clause\n- ${draftingData.nonSolicit ? 'Non-solicitation clause' : 'No non-solicit'}`;
                } else if (selectedContractType.id.includes('commission')) {
                    prompt += `\n- Commission-only payment structure\n- Clear commission terms\n- Payment on receipt\n- IP and confidentiality`;
                } else if (selectedContractType.id.includes('creator')) {
                    prompt += `\n- Content licensing terms\n- Platform specifications\n- Performance expectations\n- Feedback/review process`;
                }
            }

            // Add bias instructions for enterprise users
            if (isEnterpriseUser && selectedBias && selectedContractType.biasSides) {
                const biasSideName = selectedContractType.biasSides[selectedBias];
                prompt += `\n\nIMPORTANT: This contract should be drafted with a slight bias favoring the ${biasSideName}. This means:`;
                prompt += `\n- Use wording that provides reasonable advantages to the ${biasSideName} in areas like indemnification, liability limitations, termination rights, and payment terms`;
                prompt += `\n- Include favorable interpretations of ambiguous clauses`;
                prompt += `\n- Structure remedies and dispute resolution to benefit the ${biasSideName}`;
                prompt += `\n- Maintain professional contract standards while providing strategic advantages`;
                prompt += `\n- Ensure the contract remains fair and legally defensible, but with wording that favors the ${biasSideName}'s interests`;
            }

            // Call the existing draft endpoint
            const { data, error } = await supabase.functions.invoke('analyze-contract', {
                body: {
                    contractText: '',
                    analysisType: 'draft',
                    prompt: prompt
                },
            });

            if (error) throw error;

            onComplete(data.contract || data);
        } catch (error) {
            console.error('Drafting error:', error);
            toast({
                title: "Drafting Failed",
                description: "Unable to generate contract. Please try again or provide more details.",
                variant: "destructive",
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const renderQuestion = (question: ContractQuestion) => {
        const value = draftingData[question.id];

        switch (question.type) {
            case 'boolean':
                return (
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id={question.id}
                            checked={value || false}
                            onCheckedChange={(checked) => handleAnswerChange(question.id, checked)}
                        />
                        <Label htmlFor={question.id} className="text-sm">
                            {question.question}
                            {question.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                    </div>
                );

            case 'select':
                return (
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">
                            {question.question}
                            {question.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <Select value={value || ''} onValueChange={(val) => handleAnswerChange(question.id, val)}>
                            <SelectTrigger>
                                <SelectValue placeholder={question.placeholder} />
                            </SelectTrigger>
                            <SelectContent>
                                {question.options?.map(option => (
                                    <SelectItem key={option} value={option}>{option}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                );

            case 'multiselect':
                return (
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">
                            {question.question}
                            {question.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                            {question.options?.map(option => (
                                <div key={option} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`${question.id}-${option}`}
                                        checked={(value || []).includes(option)}
                                        onCheckedChange={(checked) => {
                                            const currentValues = value || [];
                                            const newValues = checked
                                                ? [...currentValues, option]
                                                : currentValues.filter((v: string) => v !== option);
                                            handleAnswerChange(question.id, newValues);
                                        }}
                                    />
                                    <Label htmlFor={`${question.id}-${option}`} className="text-sm">
                                        {option}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'number':
                return (
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">
                            {question.question}
                            {question.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <Input
                            type="number"
                            placeholder={question.placeholder}
                            value={value || ''}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        />
                    </div>
                );

            case 'textarea':
                return (
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">
                            {question.question}
                            {question.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <Textarea
                            placeholder={question.placeholder}
                            value={value || ''}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                            rows={3}
                        />
                    </div>
                );

            default: // text
                return (
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">
                            {question.question}
                            {question.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <Input
                            placeholder={question.placeholder}
                            value={value || ''}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        />
                    </div>
                );
        }
    };

    if (step === 'select-type') {
        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Contract Drafting Wizard
                        </CardTitle>
                        <CardDescription>
                            Choose a contract type or describe what you need to draft
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Contract Type Selection */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Choose Contract Type</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {CONTRACT_TYPES.map(type => (
                                    <Card
                                        key={type.id}
                                        className="cursor-pointer hover:shadow-md transition-shadow"
                                        onClick={() => handleContractTypeSelect(type)}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{type.icon}</span>
                                                <div>
                                                    <h4 className="font-semibold">{type.name}</h4>
                                                    <p className="text-sm text-gray-600">{type.description}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        {/* Custom Description */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Lightbulb className="h-5 w-5" />
                                Or Describe Your Contract
                            </h3>
                            <div className="space-y-3">
                                <Textarea
                                    placeholder="Describe the contract you want to draft. Include parties involved, payment terms, responsibilities, duration, etc."
                                    value={customDescription}
                                    onChange={(e) => setCustomDescription(e.target.value)}
                                    rows={4}
                                />
                                <Button onClick={handleCustomDescription} disabled={!customDescription.trim()}>
                                    Draft Custom Contract
                                </Button>
                            </div>
                        </div>

                        <Button variant="outline" onClick={onBack}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Main
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (step === 'select-bias' && selectedContractType && isEnterpriseUser) {
        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            ⚖️ Strategic Drafting Options
                        </CardTitle>
                        <CardDescription>
                            Choose which side of the contract to represent (Enterprise feature)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h3 className="text-sm font-semibold text-blue-900 mb-2">Enterprise Bias Feature</h3>
                                <p className="text-sm text-blue-800">
                                    This feature drafts contracts with slight strategic advantages favoring your chosen side,
                                    including favorable wording in indemnification, liability, termination, and payment terms.
                                    Contracts remain professionally drafted and legally sound.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-lg font-semibold">I represent:</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {Object.entries(selectedContractType.biasSides).map(([key, label]) => (
                                        <Card
                                            key={key}
                                            className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-300"
                                            onClick={() => handleBiasSelect(key)}
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h4 className="font-semibold">{label}</h4>
                                                        <p className="text-sm text-gray-600">
                                                            Draft contract with strategic advantages for the {label.toLowerCase()}
                                                        </p>
                                                    </div>
                                                    <div className="text-2xl">
                                                        {key.includes('service') || key.includes('consultant') || key.includes('employer') || key.includes('licensor') || key.includes('disclosing') ? '🛡️' : '💼'}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button variant="outline" onClick={() => setStep('select-type')}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSelectedBias(null);
                                    setStep('gather-info');
                                }}
                            >
                                Skip Bias (Neutral Draft)
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (step === 'gather-info' && selectedContractType) {
        const visibleQuestions = getVisibleQuestions();
        const progress = (Object.keys(draftingData).length / visibleQuestions.length) * 100;

        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <span className="text-2xl">{selectedContractType.icon}</span>
                            {selectedContractType.name}
                        </CardTitle>
                        <CardDescription>
                            {selectedContractType.description}
                        </CardDescription>
                        <Progress value={progress} className="w-full" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {visibleQuestions.map(question => (
                            <div key={question.id} className="space-y-2">
                                {renderQuestion(question)}
                                {question.help && (
                                    <p className="text-sm text-gray-500 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {question.help}
                                    </p>
                                )}
                            </div>
                        ))}

                        <div className="flex gap-2 pt-4">
                            <Button variant="outline" onClick={() => setStep('select-type')}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                            <Button
                                onClick={() => setStep('review-generate')}
                                disabled={!canProceedToReview()}
                            >
                                Continue
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (step === 'review-generate' && selectedContractType) {
        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            Review & Generate
                        </CardTitle>
                        <CardDescription>
                            Review your information and generate the contract
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Summary of collected information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Contract Summary</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {selectedContractType.id !== 'custom' && getVisibleQuestions().map(question => {
                                    const answer = draftingData[question.id];
                                    if (!answer) return null;

                                    return (
                                        <div key={question.id} className="space-y-1">
                                            <Label className="text-sm font-medium">{question.question}</Label>
                                            <div className="text-sm text-gray-600">
                                                {Array.isArray(answer) ? answer.join(', ') : answer}
                                            </div>
                                        </div>
                                    );
                                })}
                                {selectedContractType.id === 'custom' && (
                                    <div className="space-y-1 md:col-span-2">
                                        <Label className="text-sm font-medium">Contract Description</Label>
                                        <div className="text-sm text-gray-600">{draftingData.fullDescription}</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button variant="outline" onClick={() => setStep('gather-info')}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                            <Button onClick={handleGenerate} disabled={isGenerating}>
                                {isGenerating ? 'Generating...' : 'Generate Contract'}
                                <FileText className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return null;
};
