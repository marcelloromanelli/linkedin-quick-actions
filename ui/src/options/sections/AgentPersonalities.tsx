import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Save, FileText, Pencil, Trash2, Star, Bot } from 'lucide-react'
import type { AgentIndexEntry } from '../hooks'

interface AgentPersonalitiesProps {
  agents: AgentIndexEntry[]
  defaultAgentId: string | null
  editAgent: { id?: string; name: string; prompt: string }
  onEditAgentChange: (agent: { id?: string; name: string; prompt: string }) => void
  onSave: () => void
  onRemove: (id: string, index: number) => void
  onSetDefault: (id: string) => void
  onLoadForEdit: (id: string) => void
  onLoadDefaultPrompt: () => void
}

export function AgentPersonalities({
  agents,
  defaultAgentId,
  editAgent,
  onEditAgentChange,
  onSave,
  onRemove,
  onSetDefault,
  onLoadForEdit,
  onLoadDefaultPrompt,
}: AgentPersonalitiesProps) {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">AI Agent Personalities</h2>
        <p className="text-sm text-white/40 mt-1">
          Create different recruiting personas with custom evaluation prompts
        </p>
      </div>

      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
        {/* Agents List */}
        {agents.length > 0 && (
          <div className="border-b border-white/[0.06]">
            <Table>
              <TableHeader>
                <TableRow className="bg-white/[0.02] hover:bg-white/[0.02]">
                  <TableHead className="text-xs font-medium text-white/40 uppercase tracking-wider h-10">
                    Agent
                  </TableHead>
                  <TableHead className="text-xs font-medium text-white/40 uppercase tracking-wider h-10 text-right w-32">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((agent, index) => (
                  <TableRow key={agent.id} className="group border-white/[0.04]">
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4 text-white/40" />
                        <span className="text-sm font-medium text-white/80">{agent.name}</span>
                        {defaultAgentId === agent.id && (
                          <Badge variant="secondary" className="text-[10px]">
                            Default
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {defaultAgentId !== agent.id && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => onSetDefault(agent.id)}
                            title="Set as default"
                          >
                            <Star className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onLoadForEdit(agent.id)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onRemove(agent.id, index)}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Add/Edit Agent Form */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-white/40">
            <Plus className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wider">
              {editAgent.id ? 'Edit Agent' : 'Create New Agent'}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-3 space-y-2">
              <label className="text-xs font-medium text-white/40 uppercase tracking-wider">
                Agent Name
              </label>
              <Input
                value={editAgent.name}
                onChange={(e) => onEditAgentChange({ ...editAgent, name: e.target.value })}
                placeholder="e.g., Senior Engineer Recruiter, Culture Fit Evaluator"
                className="bg-white/[0.03] border-white/[0.08]"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={onSave} className="w-full gap-2">
                <Save className="w-4 h-4" />
                {editAgent.id ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-white/40 uppercase tracking-wider">
                System Prompt
              </label>
              <Button variant="ghost" size="sm" onClick={onLoadDefaultPrompt}>
                <FileText className="w-4 h-4 mr-1.5" />
                Load Default
              </Button>
            </div>
            <Textarea
              rows={8}
              value={editAgent.prompt}
              onChange={(e) => onEditAgentChange({ ...editAgent, prompt: e.target.value })}
              placeholder="Define the agent's personality, evaluation criteria, and response format..."
              className="font-mono text-xs bg-white/[0.03] border-white/[0.08]"
            />
            <p className="text-xs text-white/30">
              This prompt shapes how the AI evaluates candidates. Different agents can focus on
              technical skills, culture fit, leadership potential, etc.
            </p>
          </div>
          {editAgent.id && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditAgentChange({ name: '', prompt: '' })}
            >
              Cancel Edit
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}
